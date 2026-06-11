import { db } from "@/db";
import { fetchOzonPostings } from "@/lib/ozon/fetchOzonPostings";

const OZON_API_BASE = "https://api-seller.ozon.ru";

type OzonTransaction = {
  operation_type: string;
  posting: { posting_number: string };
  accruals_for_sale: number;
  sale_commission: number;
  amount: number;
  services: { name: string; price: number }[];
};

// Fetches financial transactions from Ozon for a list of posting numbers.
// Each posting may have multiple transaction operations (sale, stars, acquiring, etc.).
async function fetchTransactions(postingNumbers: string[]): Promise<OzonTransaction[]> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) return [];

  const results: OzonTransaction[] = [];

  // Ozon transaction list doesn't support batch by posting_number directly,
  // so we fetch by a wide date range and filter client-side.
  // Use a broad 180-day window to cover all unsettled orders.
  const since = new Date();
  since.setDate(since.getDate() - 180);

  let page = 1;
  while (true) {
    const res = await fetch(`${OZON_API_BASE}/v3/finance/transaction/list`, {
      method: "POST",
      headers: {
        "Client-Id": clientId,
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          date: { from: since.toISOString(), to: new Date().toISOString() },
          transaction_type: "all",
        },
        page,
        page_size: 1000,
      }),
    });

    if (!res.ok) break;
    const data = await res.json();
    const ops: OzonTransaction[] = data.result?.operations ?? [];

    const relevant = ops.filter((op) =>
      postingNumbers.includes(op.posting?.posting_number)
    );
    results.push(...relevant);

    if (page >= (data.result?.page_count ?? 1)) break;
    page++;
  }

  return results;
}

function getService(services: { name: string; price: number }[], name: string): number {
  return services.find((s) => s.name === name)?.price ?? 0;
}

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

  const transactions = await fetchTransactions(unsettledPostingNumbers);

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
    const logisticsRub = Math.abs(getService(allServices, "MarketplaceServiceItemDirectFlowLogistic"));
    const dropoffRub = Math.abs(
      getService(allServices, "MarketplaceServiceItemDropoffPVZ") +
      getService(allServices, "MarketplaceServiceItemRedistributionDropOffApvz")
    );
    const lastMileRub = Math.abs(getService(allServices, "MarketplaceServiceItemRedistributionLastMileCourier"));
    const starsMembershipRub = Math.abs(getService(allServices, "ItemAgentServiceStarsMembership"));
    const acquiringRub = Math.abs(getService(allServices, "MarketplaceRedistributionOfAcquiringOperation"));
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
