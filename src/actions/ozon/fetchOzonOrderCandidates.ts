"use server";

import { db } from "@/db";
import { fetchOzonPostings } from "@/lib/ozon/fetchOzonPostings";
import { fetchOzonTransactions, getOzonService } from "@/lib/ozon/fetchOzonTransactions";
import { fetchOzonBuyoutProducts } from "@/lib/ozon/fetchOzonBuyoutProducts";
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

export type OzonServiceFeesBreakdown = {
  logisticsRub: number;
  dropoffRub: number;
  lastMileRub: number;
  starsMembershipRub: number;
  acquiringRub: number;
  total: number;
};

export type OzonOrderCandidate = {
  postingNumber: string;
  orderDate: string;        // ISO string
  ozonStatus: string;
  mappedStatus: OrderStatusEnum;
  city: string | null;
  shipmentDate: string | null; // ISO string — warehouse handoff deadline
  totalBuyerPrice: number;     // sum of item prices × quantities
  totalPayout: number;         // sum of payouts after Ozon commission
  isBuyout: boolean;           // cross-border EAEU order where Ozon buys the goods
  // null = no payout data yet (delivering); breakdown = exact from transactions; only payout = commission exact, fees estimated
  serviceFeesBreakdown: OzonServiceFeesBreakdown | null;
  items: OzonCandidateItem[];
};

// Fetches Ozon FBS postings for a date range and returns candidates not yet imported.
// Steps:
//   1. Fetch active postings from Ozon API (with financial_data)
//   2. Filter out postings already in our DB (by postingNumber)
//   3. Look up matching products by SKU (offer_id = our product.sku)
//   4. For delivered postings: fetch transactions to get exact service fees
//   5. Return structured candidates ready for the import screen
export async function fetchOzonOrderCandidates(
  fromDate: string,
  toDate: string
): Promise<{ candidates: OzonOrderCandidate[] } | { error: string }> {
  try {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const allPostings = await fetchOzonPostings({ fromDate: from, toDate: to });

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

    // Build initial candidates from posting data
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
        isBuyout: posting.is_marketplace_buyout === true,
        serviceFeesBreakdown: null,
        items,
      };
    });

    // Step 1: For buyout orders (cross-border EAEU), fetch the buyout product report to get the
    // actual payout (Ozon buys the goods; revenue is not in financial_data).
    // Use is_marketplace_buyout flag as primary signal, zero-payout delivered as fallback.
    const buyoutCandidates = candidates.filter(
      (c) => c.ozonStatus === "delivered" && (c.isBuyout || c.totalPayout === 0)
    );

    if (buyoutCandidates.length > 0) {
      // Start from the earliest order placement date — buyout settlement can't precede it.
      // Go to today so the full window since placement is always covered.
      const earliestOrderDate = buyoutCandidates.reduce(
        (min, c) => (c.orderDate < min ? c.orderDate : min),
        buyoutCandidates[0].orderDate
      );
      const buyoutFrom = new Date(earliestOrderDate);
      const buyoutTo = new Date();

      const buyoutByPosting = await fetchOzonBuyoutProducts(buyoutFrom, buyoutTo);

      for (const candidate of buyoutCandidates) {
        const buyoutItems = buyoutByPosting.get(candidate.postingNumber);
        if (!buyoutItems || buyoutItems.length === 0) continue;

        // Update each item's payout and commission from buyout data (matched by offer_id)
        for (const item of candidate.items) {
          const bp = buyoutItems.find((b) => b.offer_id === item.offerId);
          if (!bp) continue;
          item.payout = bp.amount;
          item.commissionAmount = -(bp.seller_price_per_instance * bp.quantity - bp.amount);
          item.commissionPercent = bp.deduction_by_category_percent;
        }
        candidate.totalPayout = candidate.items.reduce((s, i) => s + i.payout, 0);
        candidate.isBuyout = true; // confirm flag even if it wasn't set from posting
      }
    }

    // Step 2: For delivered postings that now have payout data, fetch transactions to get exact
    // service fees. Includes both regular and buyout delivered orders (buyouts still have
    // logistics/dropoff fees in the standard transaction report).
    const deliveredWithPayout = candidates.filter(
      (c) => c.ozonStatus === "delivered" && c.totalPayout > 0
    );

    if (deliveredWithPayout.length > 0) {
      const deliveredNumbers = deliveredWithPayout.map((c) => c.postingNumber);
      const txFrom = new Date(from);
      txFrom.setDate(txFrom.getDate() - 7);
      const txTo = new Date(to);
      txTo.setDate(txTo.getDate() + 7);

      const transactions = await fetchOzonTransactions(txFrom, txTo, deliveredNumbers);

      const txByPosting = new Map<string, typeof transactions>();
      for (const tx of transactions) {
        const num = tx.posting?.posting_number;
        if (!num) continue;
        if (!txByPosting.has(num)) txByPosting.set(num, []);
        txByPosting.get(num)!.push(tx);
      }

      for (const candidate of deliveredWithPayout) {
        const txList = txByPosting.get(candidate.postingNumber) ?? [];
        const mainTx = txList.find((tx) => tx.operation_type === "OperationAgentDeliveredToCustomer");
        if (!mainTx) continue;

        const allServices = txList.flatMap((tx) => tx.services);
        const logisticsRub = Math.abs(
          getOzonService(allServices, "MarketplaceServiceItemDirectFlowLogistic") +
          getOzonService(allServices, "MarketplaceServiceItemDeliveryToHandoverPlaceOzon")
        );
        const dropoffRub = Math.abs(
          getOzonService(allServices, "MarketplaceServiceItemDropoffPVZ") +
          getOzonService(allServices, "MarketplaceServiceItemRedistributionDropOffApvz")
        );
        const lastMileRub = Math.abs(getOzonService(allServices, "MarketplaceServiceItemRedistributionLastMileCourier"));
        const starsMembershipRub = Math.abs(getOzonService(allServices, "ItemAgentServiceStarsMembership"));
        const acquiringRub = Math.abs(getOzonService(allServices, "MarketplaceRedistributionOfAcquiringOperation"));
        const total = logisticsRub + dropoffRub + lastMileRub + starsMembershipRub + acquiringRub;

        candidate.serviceFeesBreakdown = { logisticsRub, dropoffRub, lastMileRub, starsMembershipRub, acquiringRub, total };
      }
    }

    return { candidates };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при загрузке заказов" };
  }
}
