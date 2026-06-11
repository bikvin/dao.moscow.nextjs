"use server";

import { db } from "@/db";
import { fetchOzonPostings } from "@/lib/ozon/fetchOzonPostings";
import { OrderStatusEnum } from "@prisma/client";

// Ozon FBS statuses that represent active orders (not yet shipped or cancelled)
const ACTIVE_STATUSES = new Set([
  "awaiting_packaging",
  "awaiting_deliver",
  "delivering",
  "delivered",
  "arbitration",
  "client_arbitration",
]);

const STATUS_MAP: Record<string, OrderStatusEnum> = {
  awaiting_packaging: OrderStatusEnum.SHIPMENT_PLANNED,
  awaiting_deliver:   OrderStatusEnum.SHIPMENT_PLANNED,
  delivering:         OrderStatusEnum.SHIPMENT_PLANNED,
  delivered:          OrderStatusEnum.SHIPMENT_PLANNED,
  arbitration:        OrderStatusEnum.SHIPMENT_PLANNED,
  client_arbitration: OrderStatusEnum.SHIPMENT_PLANNED,
  cancelled:          OrderStatusEnum.CANCELLED,
};

export type OzonCandidateItem = {
  offerId: string;
  name: string;
  quantity: number;        // Ozon unit count
  buyerPrice: number;      // buyer price per Ozon unit
  payout: number;          // gross seller payout per Ozon unit (after commission)
  commissionAmount: number; // commission deducted per Ozon unit (negative)
  commissionPercent: number;
  product: {
    id: string;
    sku: string;
    variants: { id: string; variantName: string; isMain: boolean }[];
  } | null;
};

export type OzonOrderCandidate = {
  postingNumber: string;
  orderDate: string;        // ISO string
  ozonStatus: string;
  mappedStatus: OrderStatusEnum;
  city: string | null;
  shipmentDate: string | null; // ISO string — warehouse handoff deadline
  totalBuyerPrice: number;     // sum of item prices
  totalPayout: number;         // sum of payouts after commission
  feesSettled: boolean;         // true when financial_data has real payout (commission known); service fees still estimated
  items: OzonCandidateItem[];
};

// Fetches Ozon FBS postings for a date range and returns candidates not yet imported.
// Steps:
//   1. Fetch active postings from Ozon API (with financial_data)
//   2. Filter out postings already in our DB (by postingNumber)
//   3. Look up matching products by SKU (offer_id = our product.sku)
//   4. Return structured candidates ready for the import screen
export async function fetchOzonOrderCandidates(
  fromDate: string,
  toDate: string
): Promise<{ candidates: OzonOrderCandidate[] } | { error: string }> {
  try {
    const allPostings = await fetchOzonPostings({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
    });

    const active = allPostings.filter((p) => ACTIVE_STATUSES.has(p.status));
    if (active.length === 0) return { candidates: [] };

    const allPostingNumbers = active.map((p) => p.posting_number);
    const existing = await db.ozonOrderData.findMany({
      where: { postingNumber: { in: allPostingNumbers } },
      select: { postingNumber: true },
    });
    const importedNumbers = new Set(existing.map((e) => e.postingNumber));
    const toProcess = active.filter((p) => !importedNumbers.has(p.posting_number));

    if (toProcess.length === 0) return { candidates: [] };

    const allOfferIds = [...new Set(toProcess.flatMap((p) => p.products.map((i) => i.offer_id)))];
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

    const candidates: OzonOrderCandidate[] = toProcess.map((posting) => {
      const financialProducts = posting.financial_data?.products ?? [];
      const financialByProductId = new Map(financialProducts.map((fp) => [fp.product_id, fp]));

      const items: OzonCandidateItem[] = posting.products.map((item) => {
        const fp = financialByProductId.get(item.sku);
        const product = productBySku.get(item.offer_id) ?? null;

        return {
          offerId: item.offer_id,
          name: item.name,
          quantity: item.quantity,
          buyerPrice: fp?.price ?? parseFloat(item.price),
          payout: fp?.payout ?? 0,
          commissionAmount: fp?.commission_amount ?? 0,
          commissionPercent: fp?.commission_percent ?? 0,
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
      });

      const totalBuyerPrice = items.reduce((s, i) => s + i.buyerPrice * i.quantity, 0);
      const totalPayout = items.reduce((s, i) => s + i.payout, 0);

      return {
        postingNumber: posting.posting_number,
        orderDate: posting.in_process_at,
        ozonStatus: posting.status,
        mappedStatus: STATUS_MAP[posting.status] ?? OrderStatusEnum.SHIPMENT_PLANNED,
        city: posting.analytics_data?.city || posting.analytics_data?.region || null,
        shipmentDate: posting.shipment_date ?? null,
        totalBuyerPrice,
        totalPayout,
        feesSettled: totalPayout > 0,
        items,
      };
    });

    return { candidates };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при загрузке заказов" };
  }
}
