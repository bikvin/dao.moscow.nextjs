"use server";

import { db } from "@/db";

const OZON_API_BASE = "https://api-seller.ozon.ru";

type OzonReturnRecord = {
  id: number;
  return_reason_name: string;
  type: string;
  schema: string;
  order_id: number;
  order_number: string;
  product: {
    sku: number;
    offer_id: string;
    name: string;
    price: { currency_code: string; price: number };
    price_without_commission: { currency_code: string; price: number };
    commission_percent: number;
    commission: { currency_code: string; price: number };
    quantity: number;
  };
  logistic: {
    return_date: string | null;
    final_moment: string | null;
    technical_return_moment: string | null;
  };
  visual: {
    status: { id: number; display_name: string; sys_name: string };
    change_moment: string;
  };
  additional_info: { is_opened: boolean; is_super_econom: boolean };
  clearing_id: number;
  posting_number: string;
  return_clearing_id: number;
  source_id: number;
  compensation_status: { status: { sys_name: string; display_name: string }; change_moment: string } | null;
};

export type OzonReturnCandidateItem = {
  offerId: string;
  ozonSku: number;
  name: string;
  quantity: number;                    // total units returned across all return records
  priceRub: number;                    // buyer price per Ozon unit
  priceWithoutCommissionRub: number;   // seller net per Ozon unit (= priceRub - commission)
  commissionPercent: number;
  product: {
    id: string;
    sku: string;
    variants: { id: string; variantName: string; isMain: boolean }[];
  } | null;
};

export type OzonReturnCandidate = {
  postingNumber: string;
  orderNumber: string;
  ozonOrderId: string;
  returnType: string;           // "Cancellation" | "FullReturn"
  returnReasonName: string;
  returnDate: string | null;    // ISO
  visualStatus: string;         // sys_name e.g. "ReceivedBySeller"
  visualStatusDisplay: string;
  isOpened: boolean;
  items: OzonReturnCandidateItem[];
  originalOrder: { id: string; sequenceNumber: number; year: number } | null;
  sellerImpactRub: number;      // positive absolute value: sum(priceWithoutCommission × qty)
  rawReturns: unknown[];        // raw API records for this posting (used by raw data toggle)
};

// Fetches all pages of /v1/returns/list using last_id cursor pagination.
async function fetchAllReturns(
  clientId: string,
  apiKey: string,
  fromDate: string,
  toDate: string
): Promise<OzonReturnRecord[]> {
  const headers = {
    "Client-Id": clientId,
    "Api-Key": apiKey,
    "Content-Type": "application/json",
  };
  const all: OzonReturnRecord[] = [];
  let lastId = 0;

  while (true) {
    const res = await fetch(`${OZON_API_BASE}/v1/returns/list`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: {
          logistic_return_date: {
            time_from: new Date(fromDate).toISOString(),
            time_to: new Date(toDate + "T23:59:59.999Z").toISOString(),
          },
          return_schema: "FBS",
        },
        limit: 500,
        last_id: lastId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
    }

    const data = await res.json();
    const returns: OzonReturnRecord[] = data.returns ?? [];
    all.push(...returns);

    if (!data.has_next || returns.length === 0) break;
    lastId = returns[returns.length - 1].id;
  }

  return all;
}

// Fetches Ozon FBS returns for a date range and groups them by posting_number.
// Each posting = one candidate. Within a posting, records are grouped by offer_id
// (Ozon creates one record per physical unit, so quantity is always 1 per record).
// Enriches each candidate with our product records and original order reference.
export async function fetchOzonReturnCandidates(
  fromDate: string,
  toDate: string
): Promise<{ candidates: OzonReturnCandidate[] } | { error: string }> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) {
    return { error: "Не заданы OZON_CLIENT_ID или OZON_API_KEY" };
  }

  try {
    const allReturns = await fetchAllReturns(clientId, apiKey, fromDate, toDate);
    if (allReturns.length === 0) return { candidates: [] };

    // Group raw records by posting_number
    const byPosting = new Map<string, OzonReturnRecord[]>();
    for (const r of allReturns) {
      if (!byPosting.has(r.posting_number)) byPosting.set(r.posting_number, []);
      byPosting.get(r.posting_number)!.push(r);
    }

    const allOfferIds = [...new Set(allReturns.map((r) => r.product.offer_id))];
    const allPostingNumbers = [...byPosting.keys()];

    const [products, dbOriginals] = await Promise.all([
      db.product.findMany({
        where: { sku: { in: allOfferIds } },
        select: {
          id: true,
          sku: true,
          productVariants: {
            select: { id: true, variantName: true, isMain: true },
            orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
          },
        },
      }),
      db.ozonOrderData.findMany({
        where: { postingNumber: { in: allPostingNumbers } },
        select: {
          postingNumber: true,
          order: { select: { id: true, sequenceNumber: true, year: true } },
        },
      }),
    ]);

    const productBySku = new Map(products.map((p) => [p.sku, p]));
    const dbOrderByPosting = new Map(dbOriginals.map((o) => [o.postingNumber, o.order]));

    const candidates: OzonReturnCandidate[] = [];

    for (const [postingNumber, records] of byPosting) {
      const first = records[0];

      // Group records within this posting by offer_id and sum quantities
      const byOfferId = new Map<string, OzonReturnRecord[]>();
      for (const r of records) {
        if (!byOfferId.has(r.product.offer_id)) byOfferId.set(r.product.offer_id, []);
        byOfferId.get(r.product.offer_id)!.push(r);
      }

      const items: OzonReturnCandidateItem[] = [];
      let sellerImpactRub = 0;

      for (const [offerId, offerRecords] of byOfferId) {
        const sample = offerRecords[0];
        const quantity = offerRecords.reduce((s, r) => s + r.product.quantity, 0);
        const priceWithoutCommissionRub = sample.product.price_without_commission.price;
        const product = productBySku.get(offerId) ?? null;

        items.push({
          offerId,
          ozonSku: sample.product.sku,
          name: sample.product.name,
          quantity,
          priceRub: sample.product.price.price,
          priceWithoutCommissionRub,
          commissionPercent: sample.product.commission_percent,
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
        });

        sellerImpactRub += priceWithoutCommissionRub * quantity;
      }

      const dbOrder = dbOrderByPosting.get(postingNumber) ?? null;

      candidates.push({
        postingNumber,
        orderNumber: first.order_number,
        ozonOrderId: String(first.order_id),
        returnType: first.type,
        returnReasonName: first.return_reason_name,
        returnDate: first.logistic.return_date ?? first.logistic.final_moment ?? null,
        visualStatus: first.visual.status.sys_name,
        visualStatusDisplay: first.visual.status.display_name,
        isOpened: first.additional_info.is_opened,
        items,
        originalOrder: dbOrder
          ? { id: dbOrder.id, sequenceNumber: dbOrder.sequenceNumber, year: dbOrder.year }
          : null,
        sellerImpactRub,
        rawReturns: records,
      });
    }

    candidates.sort((a, b) => {
      if (!a.returnDate) return 1;
      if (!b.returnDate) return -1;
      return b.returnDate.localeCompare(a.returnDate);
    });

    return { candidates };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при загрузке возвратов" };
  }
}
