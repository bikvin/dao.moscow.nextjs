import { db } from "@/db";
import { fetchYandexOrders } from "@/lib/yandex/fetchYandexOrders";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

type YandexOrderItem = {
  offerId: string;
  count: number;
  priceBeforeDiscount: number;
};

type YandexOrder = {
  id: number;
  fake: boolean;
  items: YandexOrderItem[];
};

type OrderStat = {
  id: number;
  commissions?: { type: string; actual: number }[];
};

// Fetches financial stats from Yandex stats/orders API for a batch of order IDs.
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

function getFee(stat: OrderStat | undefined, type: string): number {
  return stat?.commissions?.find((c) => c.type === type)?.actual ?? 0;
}

// Finds all imported orders with unsettled Yandex fees, fetches the latest commission
// data from the Yandex API, and recalculates per-item net prices + order totals for
// any orders that are now fully settled (at least one non-AGENCY commission present).
// Returns the count of updated orders.
export async function recalculateYandexCommissions(): Promise<{ updated: number }> {
  const unsettled = await db.order.findMany({
    where: { yandexData: { feesSettled: false } },
    include: {
      yandexData: true,
      items: { select: { id: true, productId: true, quantity: true, priceUnit: true } },
    },
  });

  if (unsettled.length === 0) return { updated: 0 };

  const minDate = unsettled.reduce(
    (min, o) => (o.orderDate < min ? o.orderDate : min),
    unsettled[0].orderDate
  );
  const fromDate = new Date(minDate);
  fromDate.setDate(fromDate.getDate() - 1);

  const allYandexOrders = (await fetchYandexOrders({
    fromDate,
    toDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })) as YandexOrder[];

  const unsettledYandexIds = new Set(unsettled.map((o) => o.yandexData!.yandexOrderId));
  const yandexOrderMap = new Map(
    allYandexOrders
      .filter((o) => !o.fake && unsettledYandexIds.has(String(o.id)))
      .map((o) => [String(o.id), o])
  );

  const stats = await fetchStats([...unsettledYandexIds].map((id) => parseInt(id)));
  const statsById = new Map(stats.map((s) => [String(s.id), s]));

  const [commissionRateSetting, globalDivisorSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "yandexCommissionRate" } }),
    db.settings.findUnique({ where: { field: "yandexDefaultDivisor" } }),
  ]);
  const commissionRate = commissionRateSetting ? parseFloat(commissionRateSetting.value) : 0;
  const globalDivisor = globalDivisorSetting ? parseInt(globalDivisorSetting.value, 10) : 1;

  const allProductIds = [...new Set(unsettled.flatMap((o) => o.items.map((i) => i.productId)))];
  const allOfferIds = [...new Set(
    [...yandexOrderMap.values()].flatMap((o) => o.items.map((i) => i.offerId))
  )];

  const [mappings, products] = await Promise.all([
    db.yandexMarketMapping.findMany({
      where: { yandexSku: { in: allOfferIds } },
      select: { yandexSku: true, divisor: true },
    }),
    db.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, sku: true, length_mm: true, width_mm: true },
    }),
  ]);

  const divisorBySku = new Map(mappings.map((m) => [m.yandexSku, m.divisor]));
  const dimensionsById = new Map(products.map((p) => [p.id, p]));
  const productIdBySku = new Map(products.map((p) => [p.sku, p.id]));

  let updatedCount = 0;

  for (const order of unsettled) {
    const yandexData = order.yandexData!;
    const yandexOrder = yandexOrderMap.get(yandexData.yandexOrderId);
    const stat = statsById.get(yandexData.yandexOrderId);

    // AGENCY (0.12 ₽/item) is posted early and does not mean full settlement.
    // Only proceed when at least one other commission type has arrived.
    const isSettled = stat?.commissions?.some((c) => c.type !== "AGENCY") ?? false;
    if (!yandexOrder || !isSettled) continue;

    const totalYandexUnits = yandexOrder.items.reduce((s, i) => s + i.count, 0);
    const deliveryRub = getFee(stat, "DELIVERY_TO_CUSTOMER");
    const expressDeliveryRub = getFee(stat, "EXPRESS_DELIVERY_TO_CUSTOMER");
    const crossDeliveryRub = getFee(stat, "CROSSREGIONAL_DELIVERY");
    const paymentTransferRub = getFee(stat, "PAYMENT_TRANSFER");
    const agencyRub = getFee(stat, "AGENCY");
    const loyaltyFeeRub = getFee(stat, "LOYALTY_PARTICIPATION_FEE");
    const sortingRub = getFee(stat, "SORTING");
    const feeRub = getFee(stat, "FEE");
    const otherFees = deliveryRub + expressDeliveryRub + crossDeliveryRub +
      paymentTransferRub + agencyRub + loyaltyFeeRub + sortingRub;

    let newTotalRub = 0;

    await db.$transaction(async (tx) => {
      for (const yandexItem of yandexOrder.items) {
        const productId = productIdBySku.get(yandexItem.offerId);
        if (!productId) continue;

        const dbItem = order.items.find((i) => i.productId === productId);
        if (!dbItem) continue;

        const effectiveDivisor = divisorBySku.get(yandexItem.offerId) ?? globalDivisor;
        const itemNetPerYandexUnit =
          yandexItem.priceBeforeDiscount * (1 - commissionRate / 100) -
          otherFees / totalYandexUnits;

        const dims = dimensionsById.get(productId);
        const warehouseQty = yandexItem.count * effectiveDivisor;
        let priceRubKopecks: number;
        let itemTotal: number;

        if (dims?.length_mm && dims.width_mm) {
          const m2PerYandexUnit = (dims.length_mm * dims.width_mm * effectiveDivisor) / 1_000_000;
          const quantityM2 = (dims.length_mm * dims.width_mm * warehouseQty) / 1_000_000;
          priceRubKopecks = Math.round((itemNetPerYandexUnit / m2PerYandexUnit) * 100);
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
          priceRubKopecks = Math.round((itemNetPerYandexUnit / effectiveDivisor) * 100);
          itemTotal = warehouseQty * priceRubKopecks;
          await tx.orderItem.update({
            where: { id: dbItem.id },
            data: { priceInCents: priceRubKopecks, priceRub: priceRubKopecks, totalRub: itemTotal },
          });
        }

        newTotalRub += itemTotal;
      }

      await tx.yandexOrderData.update({
        where: { id: yandexData.id },
        data: {
          feesSettled: true,
          feeRub,
          deliveryRub,
          expressDeliveryRub,
          crossDeliveryRub,
          paymentTransferRub,
          agencyRub,
          loyaltyFeeRub,
          sortingRub,
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
