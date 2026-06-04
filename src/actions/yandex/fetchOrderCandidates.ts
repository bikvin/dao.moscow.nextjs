"use server";

import { db } from "@/db";
import { fetchYandexOrders } from "@/lib/yandex/fetchYandexOrders";
import { OrderStatusEnum } from "@prisma/client";
import { STATUS_MAP } from "./yandexStatusMap";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

type YandexOrderItem = {
  offerId: string;   // = our product SKU
  offerName: string;
  count: number;
  price: number;     // per item in rubles
};

type YandexOrder = {
  id: number;
  status: string;
  creationDate: string;
  buyerTotal: number;                // actual buyer payment after all discounts
  buyerTotalBeforeDiscount: number;  // listed retail price before any discount
  subsidies?: { type: string; amount: number }[]; // Yandex-funded discounts reimbursed to seller
  fake: boolean;
  items: YandexOrderItem[];
};

type OrderStat = {
  id: number;
  commissions?: { type: string; actual: number }[];
};

export type CandidateVariant = {
  id: string;
  variantName: string;
  isMain: boolean;
};

export type CandidateItem = {
  offerId: string;
  offerName: string;
  count: number;
  priceRub: number;
  // null if SKU not found in our product catalog — item will be skipped on import
  product: {
    id: string;
    sku: string;
    variants: CandidateVariant[];
  } | null;
};

export type CandidateFees = {
  feeRub: number;             // FEE — placement commission (API value, net of subsidy offset)
  deliveryRub: number;        // DELIVERY_TO_CUSTOMER
  expressDeliveryRub: number; // EXPRESS_DELIVERY_TO_CUSTOMER
  crossDeliveryRub: number;   // CROSSREGIONAL_DELIVERY
  paymentTransferRub: number; // PAYMENT_TRANSFER
  agencyRub: number;          // AGENCY — flat 0.12 ₽ per item
  loyaltyFeeRub: number;      // LOYALTY_PARTICIPATION_FEE
  sortingRub: number;         // SORTING
};

export type OrderCandidate = {
  yandexOrderId: string;
  orderDate: string;
  yandexStatus: string;
  mappedStatus: OrderStatusEnum;
  sellPrice: number;    // buyerTotal + subsidyTotal — actual seller payout basis
  buyerTotal: number;   // what the buyer paid out of pocket
  subsidyTotal: number; // Yandex-funded discount reimbursed to seller
  fees: CandidateFees;
  // true if the stats API returned commission data (order is settled by Yandex).
  // false for new orders — net will be shown as an estimate using stored commission rate.
  feesSettled: boolean;
  items: CandidateItem[];
};

// Fetches financial stats from Yandex stats/orders API for a batch of order IDs.
// The stats API only returns data for settled orders. For orders still in transit,
// the commissions array will be empty (feesSettled = false).
// Processes in chunks of 200 (API limit).
async function fetchStats(orderIds: number[]): Promise<OrderStat[]> {
  const token = process.env.YANDEX_API_TOKEN;
  const campaignId = process.env.YANDEX_CAMPAIGN_ID;
  if (!token || !campaignId) return [];

  const results: OrderStat[] = [];
  for (let i = 0; i < orderIds.length; i += 200) {
    const chunk = orderIds.slice(i, i + 200);
    const res = await fetch(`${YANDEX_API_BASE}/campaigns/${campaignId}/stats/orders`, {
      method: "POST",
      headers: { "Api-Key": token, "Content-Type": "application/json" },
      body: JSON.stringify({ orders: chunk }),
    });
    if (!res.ok) continue;
    const data = await res.json();
    results.push(...(data.result?.orders ?? []));
  }
  return results;
}

// Extracts a specific commission type value from order stats, defaulting to 0.
function getFee(stat: OrderStat | undefined, type: string): number {
  return stat?.commissions?.find((c) => c.type === type)?.actual ?? 0;
}

// Fetches Yandex orders for a date range and returns candidates not yet imported.
// Steps:
//   1. Fetch all orders from Yandex API for the given date range
//   2. Remove fake/test orders
//   3. Filter out orders already in our DB (by yandexOrderId)
//   4. Fetch financial stats for remaining orders (fees, commissions)
//   5. Look up matching products by SKU (offerId = our product.sku)
//   6. Return structured candidates ready to display on the import screen
export async function fetchOrderCandidates(
  fromDate: string,
  toDate: string
): Promise<{ candidates: OrderCandidate[] } | { error: string }> {
  try {
    const orders = (await fetchYandexOrders({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
    })) as YandexOrder[];

    const nonFake = orders.filter((o) => !o.fake);
    if (nonFake.length === 0) return { candidates: [] };

    // Check which orders are already imported
    const allIds = nonFake.map((o) => String(o.id));
    const existing = await db.yandexOrderData.findMany({
      where: { yandexOrderId: { in: allIds } },
      select: { yandexOrderId: true },
    });
    const importedIds = new Set(existing.map((e) => e.yandexOrderId));
    const toProcess = nonFake.filter((o) => !importedIds.has(String(o.id)));

    if (toProcess.length === 0) return { candidates: [] };

    // Fetch financial stats — available only for settled orders
    const stats = await fetchStats(toProcess.map((o) => o.id));
    const statsById = new Map(stats.map((s) => [s.id, s]));

    // Bulk product lookup: Yandex offerId = our product.sku
    const allOfferIds = [...new Set(toProcess.flatMap((o) => o.items.map((i) => i.offerId)))];
    const products = await db.product.findMany({
      where: { sku: { in: allOfferIds } },
      select: {
        id: true,
        sku: true,
        productVariants: {
          select: { id: true, variantName: true, isMain: true },
          orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
        },
      },
    });
    const productBySku = new Map(products.map((p) => [p.sku, p]));

    const candidates: OrderCandidate[] = toProcess.map((order) => {
      const stat = statsById.get(order.id);
      // feesSettled = true only if Yandex returned commission data for this order
      const feesSettled = (stat?.commissions?.length ?? 0) > 0;

      const subsidyTotal = order.subsidies?.reduce((s, x) => s + x.amount, 0) ?? 0;

      return {
        yandexOrderId: String(order.id),
        orderDate: order.creationDate,
        yandexStatus: order.status,
        mappedStatus: STATUS_MAP[order.status] ?? OrderStatusEnum.RESERVE,
        sellPrice: order.buyerTotal + subsidyTotal,
        buyerTotal: order.buyerTotal,
        subsidyTotal,
        feesSettled,
        fees: {
          feeRub: getFee(stat, "FEE"),
          deliveryRub: getFee(stat, "DELIVERY_TO_CUSTOMER"),
          expressDeliveryRub: getFee(stat, "EXPRESS_DELIVERY_TO_CUSTOMER"),
          crossDeliveryRub: getFee(stat, "CROSSREGIONAL_DELIVERY"),
          paymentTransferRub: getFee(stat, "PAYMENT_TRANSFER"),
          agencyRub: getFee(stat, "AGENCY"),
          loyaltyFeeRub: getFee(stat, "LOYALTY_PARTICIPATION_FEE"),
          sortingRub: getFee(stat, "SORTING"),
        },
        items: order.items.map((item) => {
          const product = productBySku.get(item.offerId) ?? null;
          return {
            offerId: item.offerId,
            offerName: item.offerName,
            count: item.count,
            priceRub: item.price,
            product: product
              ? {
                  id: product.id,
                  sku: product.sku,
                  variants: product.productVariants.map((v) => ({
                    id: v.id,
                    variantName: v.variantName,
                    isMain: v.isMain,
                  })),
                }
              : null,
          };
        }),
      };
    });

    return { candidates };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при загрузке заказов" };
  }
}
