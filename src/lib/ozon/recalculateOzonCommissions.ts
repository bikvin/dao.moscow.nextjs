import { db } from "@/db";
import { fetchOzonPostings } from "@/lib/ozon/fetchOzonPostings";
import { fetchOzonTransactions, getOzonService, type OzonTransaction } from "@/lib/ozon/fetchOzonTransactions";

// Finds all imported Ozon orders with unsettled fees, fetches transaction data,
// and for orders where the main sale operation has settled: recalculates per-item
// net prices using actual service fees, updates orderItems + OzonOrderData + order totals.
export async function recalculateOzonCommissions(): Promise<{ updated: number }> {
  const unsettled = await db.order.findMany({
    where: { ozonData: { feesSettled: false } },
    include: {
      ozonData: true,
      items: { select: { id: true, productId: true, quantity: true } },
    },
  });

  if (unsettled.length === 0) return { updated: 0 };

  const unsettledPostingNumbers = unsettled.map((o) => o.ozonData!.postingNumber);

  // Re-fetch postings to get current financial_data (payout per item)
  const minDate = unsettled.reduce(
    (min, o) => (o.orderDate < min ? o.orderDate : min),
    unsettled[0].orderDate
  );
  const fromDate = new Date(minDate);
  fromDate.setDate(fromDate.getDate() - 1);

  const allPostings = await fetchOzonPostings({ fromDate });
  const postingMap = new Map(
    allPostings
      .filter((p) => unsettledPostingNumbers.includes(p.posting_number))
      .map((p) => [p.posting_number, p])
  );

  const toDate = new Date();
  const transactions = await fetchOzonTransactions(fromDate, toDate, unsettledPostingNumbers);

  // Group transactions by posting number
  const txByPosting = new Map<string, OzonTransaction[]>();
  for (const tx of transactions) {
    const num = tx.posting?.posting_number;
    if (!num) continue;
    if (!txByPosting.has(num)) txByPosting.set(num, []);
    txByPosting.get(num)!.push(tx);
  }

  const globalDivisorSetting = await db.settings.findUnique({
    where: { field: "ozonDefaultDivisor" },
  });
  const globalDivisor = globalDivisorSetting ? parseInt(globalDivisorSetting.value, 10) : 1;

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
  const productIdBySku = new Map(products.map((p) => [p.sku, p.id]));

  let updatedCount = 0;

  for (const order of unsettled) {
    const ozonData = order.ozonData!;
    const posting = postingMap.get(ozonData.postingNumber);
    const txList = txByPosting.get(ozonData.postingNumber) ?? [];

    // Only settle when the main delivery operation is present
    const mainTx = txList.find((tx) => tx.operation_type === "OperationAgentDeliveredToCustomer");
    if (!posting || !mainTx) continue;

    const totalOzonUnits = posting.products.reduce((s, p) => s + p.quantity, 0);
    const financialByProductId = new Map(
      (posting.financial_data?.products ?? []).map((fp) => [fp.product_id, fp])
    );

    // Sum all service fees across all transaction operations for this posting
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
    const totalServiceFees = logisticsRub + dropoffRub + lastMileRub + starsMembershipRub + acquiringRub;

    let newTotalRub = 0;

    await db.$transaction(async (tx) => {
      for (const postingItem of posting.products) {
        const productId = productIdBySku.get(postingItem.offer_id);
        if (!productId) continue;

        const dbItem = order.items.find((i) => i.productId === productId);
        if (!dbItem) continue;

        const fp = financialByProductId.get(postingItem.sku);
        if (!fp) continue;

        const effectiveDivisor = divisorBySku.get(postingItem.offer_id) ?? globalDivisor;
        const payoutPerOzonUnit = fp.payout / fp.quantity;
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

      await tx.ozonOrderData.update({
        where: { id: ozonData.id },
        data: {
          feesSettled: true,
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

    updatedCount++;
  }

  return { updated: updatedCount };
}
