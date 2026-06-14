"use server";

import { db } from "@/db";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

// Formats a Date to DD-MM-YYYY as required by the Yandex returns API.
function toYandexDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

type YandexReturnItem = {
  shopSku: string;
  count: number;
  decisions?: { decisionType?: string }[];
};

type YandexReturn = {
  id: number;
  orderId: number;
  returnType: string;
  refundStatus?: string;
  shipmentStatus?: string;
  amount?: { value: number };
  creationDate?: string;
  items?: YandexReturnItem[];
};

type YandexOrderItem = {
  offerId: string;
  count: number;
  priceBeforeDiscount: number;
};

export type ReturnCandidateVariant = {
  id: string;
  variantName: string;
  isMain: boolean;
};

export type ReturnCandidate = {
  yandexReturnId: string;
  yandexOrderId: string;
  returnType: string;
  refundStatus: string | null;
  shipmentStatus: string | null;
  buyerRefundRub: number;
  creationDate: string | null;
  // Per returned item: SKU, count, priceBeforeDiscount from the original Yandex order,
  // and our product record if found by SKU.
  returnedItems: {
    shopSku: string;
    count: number;
    priceBeforeDiscount: number | null;
    product: { id: string; sku: string; variants: ReturnCandidateVariant[] } | null;
  }[];
  // Our DB record for the original sale order, if it was imported.
  originalOrder: {
    id: string;
    sequenceNumber: number;
    year: number;
  } | null;
  // Seller's estimated net loss as a positive absolute value: sum(priceBeforeDiscount × (1-rate))
  // null if priceBeforeDiscount is unavailable for any returned item.
  sellerImpactRub: number | null;
};

// Fetches all pages of the Yandex returns API for the given DD-MM-YYYY date range.
async function fetchAllReturns(
  token: string,
  campaignId: string,
  from: string,
  to: string
): Promise<YandexReturn[]> {
  const all: YandexReturn[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${YANDEX_API_BASE}/campaigns/${campaignId}/returns`);
    url.searchParams.set("fromDate", from);
    url.searchParams.set("toDate", to);
    url.searchParams.set("limit", "50");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const res = await fetch(url.toString(), { headers: { "Api-Key": token } });
    if (!res.ok) throw new Error(`Returns API HTTP ${res.status}`);
    const data = await res.json();
    all.push(...(data.result?.returns ?? []));
    pageToken = data.result?.pager?.nextPageToken ?? undefined;
  } while (pageToken);
  return all;
}

// Fetches a single order from the Yandex orders API to get per-item priceBeforeDiscount.
async function fetchOrderItems(
  token: string,
  campaignId: string,
  orderId: number
): Promise<YandexOrderItem[] | null> {
  const res = await fetch(`${YANDEX_API_BASE}/campaigns/${campaignId}/orders/${orderId}`, {
    headers: { "Api-Key": token },
  });
  if (!res.ok) {
    console.warn(`[fetchReturnCandidates] Order ${orderId} fetch failed: HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  return (data.order?.items ?? []).map((i: { offerId: string; shopSku?: string; count: number; priceBeforeDiscount?: number; price?: number }) => ({
    offerId: i.shopSku ?? i.offerId,
    count: i.count,
    priceBeforeDiscount: i.priceBeforeDiscount ?? i.price ?? 0,
  }));
}

// Fetches Yandex returns for a date range and returns candidates not yet imported.
// Steps:
//   1. Fetch all returns from Yandex returns API (paginated)
//   2. Filter out already-imported returns (by yandexReturnId in our DB)
//   3. Fetch original order from Yandex API in parallel to get priceBeforeDiscount per item
//   4. Look up original orders in our DB (to show our internal order number)
//   5. Calculate seller impact (positive abs): sum(returnedItems.priceBeforeDiscount × (1-rate))
export async function fetchReturnCandidates(
  fromDate: string,
  toDate: string,
  commissionRate: number
): Promise<{ candidates: ReturnCandidate[] } | { error: string }> {
  const token = process.env.YANDEX_API_TOKEN;
  const campaignId = process.env.YANDEX_CAMPAIGN_ID;
  if (!token || !campaignId) {
    return { error: "Не заданы YANDEX_API_TOKEN или YANDEX_CAMPAIGN_ID" };
  }

  try {
    const from = toYandexDate(new Date(fromDate));
    const to = toYandexDate(new Date(toDate));

    const allReturns = await fetchAllReturns(token, campaignId, from, to);
    if (allReturns.length === 0) return { candidates: [] };

    // Filter out already-imported returns
    const allReturnIds = allReturns.map((r) => String(r.id));
    const existing = await db.yandexReturnData.findMany({
      where: { yandexReturnId: { in: allReturnIds } },
      select: { yandexReturnId: true },
    });
    const importedIds = new Set(existing.map((e) => e.yandexReturnId));
    const toProcess = allReturns.filter((r) => !importedIds.has(String(r.id)));
    if (toProcess.length === 0) return { candidates: [] };

    // Fetch original Yandex order data and our DB records in parallel
    const uniqueOrderIds = [...new Set(toProcess.map((r) => r.orderId))];

    // Collect all returned SKUs for product lookup
    const allReturnedSkus = [
      ...new Set(toProcess.flatMap((r) => (r.items ?? []).map((i) => i.shopSku))),
    ];

    // Fetch order items sequentially to avoid hitting Yandex rate limits.
    // Run DB lookups in parallel while orders are being fetched.
    const [orderItemsResults, dbOriginals, products] = await Promise.all([
      (async () => {
        const results: { orderId: number; items: YandexOrderItem[] | null }[] = [];
        for (const orderId of uniqueOrderIds) {
          results.push({ orderId, items: await fetchOrderItems(token, campaignId, orderId) });
        }
        return results;
      })(),
      db.yandexOrderData.findMany({
        where: { yandexOrderId: { in: uniqueOrderIds.map(String) } },
        select: {
          yandexOrderId: true,
          order: { select: { id: true, sequenceNumber: true, year: true } },
        },
      }),
      db.product.findMany({
        where: { sku: { in: allReturnedSkus } },
        select: {
          id: true,
          sku: true,
          productVariants: {
            select: { id: true, variantName: true, isMain: true },
            orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
          },
        },
      }),
    ]);

    const orderItemsById = new Map(orderItemsResults.map((r) => [r.orderId, r.items]));
    const dbOrderByYandexId = new Map(dbOriginals.map((o) => [o.yandexOrderId, o.order]));
    const productBySku = new Map(products.map((p) => [p.sku, p]));

    const candidates: ReturnCandidate[] = toProcess.map((r) => {
      const orderItems = orderItemsById.get(r.orderId) ?? null;
      const returnedSkus = r.items ?? [];

      // Map returned SKUs to priceBeforeDiscount (from original order) and our product record
      const returnedItems = returnedSkus.map((ri) => {
        const original = orderItems?.find((oi) => oi.offerId === ri.shopSku) ?? null;
        const product = productBySku.get(ri.shopSku) ?? null;
        return {
          shopSku: ri.shopSku,
          count: ri.count,
          priceBeforeDiscount: original ? original.priceBeforeDiscount : null,
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

      // Calculate seller impact (positive absolute value) only if all priceBeforeDiscount values are available.
      // Display layer negates this for RETURN orderType.
      const allKnown = returnedItems.length > 0 && returnedItems.every((i) => i.priceBeforeDiscount !== null);
      const sellerImpactRub = allKnown
        ? Math.round(
            returnedItems.reduce(
              (s, i) => s + (i.priceBeforeDiscount! * i.count * (1 - commissionRate / 100)),
              0
            )
          )
        : null;

      const dbOrder = dbOrderByYandexId.get(String(r.orderId)) ?? null;

      return {
        yandexReturnId: String(r.id),
        yandexOrderId: String(r.orderId),
        returnType: r.returnType,
        refundStatus: r.refundStatus ?? null,
        shipmentStatus: r.shipmentStatus ?? null,
        buyerRefundRub: r.amount?.value ?? 0,
        creationDate: r.creationDate ?? null,
        returnedItems,
        originalOrder: dbOrder
          ? { id: dbOrder.id, sequenceNumber: dbOrder.sequenceNumber, year: dbOrder.year }
          : null,
        sellerImpactRub,
      };
    });

    return { candidates };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при загрузке возвратов" };
  }
}
