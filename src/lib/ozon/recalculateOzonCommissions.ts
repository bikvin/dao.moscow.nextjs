import { db } from "@/db";
import { fetchOzonPostings, fetchOzonPostingsByNumbers } from "@/lib/ozon/fetchOzonPostings";
import { fetchOzonAccrualsByPosting } from "@/lib/ozon/fetchOzonTransactions";

// Finds all imported Ozon orders with unsettled fees, fetches transaction data,
// and for orders where the main sale operation has settled: recalculates per-item
// net prices using actual service fees, updates orderItems + OzonOrderData + order totals.
export type CommissionChange = {
  orderId: string;
  sequenceNumber: number;
  year: number;
  estimatedTotalRub: number;
  realTotalRub: number | null; // null = still pending, not yet settled by Ozon
  isEstimated?: boolean; // true when settled using buyer-price estimate (no Ozon payout data)
};

export async function recalculateOzonCommissions(): Promise<{ updated: number; changes: CommissionChange[] }> {
  const unsettled = await db.order.findMany({
    where: { ozonData: { feesSettled: false } },
    include: {
      ozonData: true,
      items: { select: { id: true, productId: true, quantity: true } },
    },
  });

  if (unsettled.length === 0) return { updated: 0, changes: [] };

  const unsettledPostingNumbers = unsettled.map((o) => o.ozonData!.postingNumber);

  // Re-fetch postings to get current financial_data (payout per item)
  const minDate = unsettled.reduce(
    (min, o) => (o.orderDate < min ? o.orderDate : min),
    unsettled[0].orderDate
  );
  const fromDate = new Date(minDate);
  fromDate.setDate(fromDate.getDate() - 1);

  const [allPostings, accrualMap] = await Promise.all([
    fetchOzonPostings({ fromDate }),
    fetchOzonAccrualsByPosting(unsettledPostingNumbers),
  ]);

  const postingMap = new Map(
    allPostings
      .filter((p) => unsettledPostingNumbers.includes(p.posting_number))
      .map((p) => [p.posting_number, p])
  );

  // Fetch postings not returned by the date-range list (old finalized orders are
  // archived by Ozon and only accessible by posting number via the get endpoint).
  const missingNumbers = unsettledPostingNumbers.filter((pn) => !postingMap.has(pn));
  if (missingNumbers.length > 0) {
    const fetched = await fetchOzonPostingsByNumbers(missingNumbers);
    for (const p of fetched) postingMap.set(p.posting_number, p);
  }

  const [globalDivisorSetting, avgCommissionSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "ozonDefaultDivisor" } }),
    db.settings.findUnique({ where: { field: "ozonAverageCommissionPercent" } }),
  ]);
  const globalDivisor = globalDivisorSetting ? parseInt(globalDivisorSetting.value, 10) : 1;
  const avgCommissionPercent = avgCommissionSetting ? parseFloat(avgCommissionSetting.value) : 0;

  const allProductIds = [...new Set(unsettled.flatMap((o) => o.items.map((i) => i.productId)))];
  const allOfferIds = [...new Set(
    [...postingMap.values()].flatMap((p) => p.products.map((i) => i.offer_id))
  )];

  const [mappings, products] = await Promise.all([
    db.ozonMapping.findMany({
      where: { ozonOfferId: { in: allOfferIds } },
      select: { ozonOfferId: true, divisor: true },
    }),
    db.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, sku: true, length_mm: true, width_mm: true },
    }),
  ]);

  const divisorBySku = new Map(mappings.map((m) => [m.ozonOfferId, m.divisor]));
  const dimensionsById = new Map(products.map((p) => [p.id, p]));
  // Reverse map: productId → sku (used to match order items by their product's offer_id).
  // A global sku→id map would break when two orders reference different DB products that
  // share the same sku (e.g. after a product was recreated).
  const productSkuById = new Map(products.map((p) => [p.id, p.sku]));

  let updatedCount = 0;
  const changes: CommissionChange[] = [];

  for (const order of unsettled) {
    const ozonData = order.ozonData!;
    const posting = postingMap.get(ozonData.postingNumber);
    const accruals = accrualMap.get(ozonData.postingNumber);

    // financial_data being populated is the authoritative sign the order is settled.
    // Accruals are used only for the fee amount; if unavailable (old orders beyond the
    // accruals API lookback), fall back to 0 fees so payout is used as-is.
    const financialProducts = posting?.financial_data?.products ?? [];
    if (!posting || financialProducts.length === 0) continue;

    const estimatedTotalRub = order.totalRub ?? 0;

    const totalOzonUnits = posting.products.reduce((s, p) => s + p.quantity, 0);
    const financialByProductId = new Map(
      financialProducts.map((fp) => [fp.product_id, fp])
    );

    const totalServiceFees = accruals?.totalFeesRub ?? 0;
    const logisticsRub = totalServiceFees;
    const dropoffRub = 0;
    const lastMileRub = 0;
    const starsMembershipRub = 0;
    const acquiringRub = 0;

    let newTotalRub = 0;
    let usedEstimate = false;

    await db.$transaction(async (tx) => {
      for (const postingItem of posting.products) {
        // Find the order item whose product's sku matches this posting item's offer_id.
        // Using order.items as the source of truth avoids stale-id mismatches when
        // two products share a sku but have different DB ids.
        const dbItem = order.items.find(
          (i) => productSkuById.get(i.productId) === postingItem.offer_id
        );
        if (!dbItem) continue;

        const productId = dbItem.productId;

        const fp = financialByProductId.get(postingItem.sku);
        if (!fp) continue;

        const effectiveDivisor = divisorBySku.get(postingItem.offer_id) ?? globalDivisor;
        // Payout source priority (most → least accurate):
        // 1. Accruals API: the authoritative settled amount (sku > 0, positive entries)
        // 2. financial_data.payout: present for recent orders not yet cleared
        // 3. Price × (1 − avg commission): estimate for very old orders where Ozon
        //    has already disbursed and zeroed out both payout and commission fields
        const accrualPayout = accruals?.payoutByProductSku.get(postingItem.sku);
        const usingEstimate = !(accrualPayout != null && accrualPayout > 0) && !(fp.payout > 0);
        if (usingEstimate) usedEstimate = true;
        const rawPayout = (accrualPayout != null && accrualPayout > 0)
          ? accrualPayout
          : fp.payout > 0
            ? fp.payout
            : fp.price * fp.quantity * (1 - avgCommissionPercent / 100);
        const payoutPerOzonUnit = rawPayout / fp.quantity;
        const netPerOzonUnit = payoutPerOzonUnit - totalServiceFees / totalOzonUnits;
        const warehouseQty = postingItem.quantity * effectiveDivisor;

        const dims = dimensionsById.get(productId);
        let priceRubKopecks: number;
        let itemTotal: number;

        if (dims?.length_mm && dims.width_mm) {
          const m2PerOzonUnit = (dims.length_mm * dims.width_mm * effectiveDivisor) / 1_000_000;
          const quantityM2 = (dims.length_mm * dims.width_mm * warehouseQty) / 1_000_000;
          priceRubKopecks = Math.round((netPerOzonUnit / m2PerOzonUnit) * 100);
          itemTotal = Math.round(quantityM2 * priceRubKopecks);
          await tx.orderItem.update({
            where: { id: dbItem.id },
            data: {
              priceInCents: priceRubKopecks,
              priceRub: priceRubKopecks,
              totalRub: itemTotal,
              quantityM2: (dims.length_mm * dims.width_mm * warehouseQty) / 1_000_000,
            },
          });
        } else {
          priceRubKopecks = Math.round((netPerOzonUnit / effectiveDivisor) * 100);
          itemTotal = warehouseQty * priceRubKopecks;
          await tx.orderItem.update({
            where: { id: dbItem.id },
            data: { priceInCents: priceRubKopecks, priceRub: priceRubKopecks, totalRub: itemTotal },
          });
        }

        newTotalRub += itemTotal;
      }

      // Skip settling if no items were matched — product SKUs may not align with Ozon offer_ids.
      // This keeps feesSettled: false so the order retries on the next recalculation run.
      if (newTotalRub === 0) return;

      await tx.ozonOrderData.update({
        where: { id: ozonData.id },
        data: {
          feesSettled: true,
          feesEstimated: usedEstimate,
          logisticsRub,
          dropoffRub,
          lastMileRub,
          starsMembershipRub,
          acquiringRub,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { totalRub: newTotalRub },
      });
    });

    if (newTotalRub === 0) continue;

    changes.push({
      orderId: order.id,
      sequenceNumber: order.sequenceNumber,
      year: order.year,
      estimatedTotalRub,
      realTotalRub: newTotalRub,
      isEstimated: usedEstimate || undefined,
    });
    updatedCount++;
  }

  // Append orders that still have estimates (not yet settled by Ozon)
  const settledIds = new Set(changes.map((c) => c.orderId));
  for (const order of unsettled) {
    if (settledIds.has(order.id)) continue;
    changes.push({
      orderId: order.id,
      sequenceNumber: order.sequenceNumber,
      year: order.year,
      estimatedTotalRub: order.totalRub ?? 0,
      realTotalRub: null,
    });
  }

  changes.sort((a, b) => a.year !== b.year ? a.year - b.year : a.sequenceNumber - b.sequenceNumber);
  return { updated: updatedCount, changes };
}
