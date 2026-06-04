"use server";

import { fetchYandexOrders } from "@/lib/yandex/fetchYandexOrders";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

type YandexOrderItem = { count: number };
type YandexOrder = { id: number; fake: boolean; items: YandexOrderItem[] };
type OrderStat = { id: number; commissions?: { type: string; actual: number }[] };

// Extracts a fee value by type from order stats, defaulting to 0.
function getFee(stat: OrderStat, type: string): number {
  return stat.commissions?.find((c) => c.type === type)?.actual ?? 0;
}

// Fetches financial stats from Yandex for a batch of order IDs (max 200 per request).
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

// Fetches orders for the last 90 days from Yandex, then retrieves their financial stats.
// For each settled order (stats API returned commission data), sums all non-commission fees
// (delivery, express, cross-regional, payment transfer, agency, loyalty, sorting) and
// divides by total units across those orders to get an average fee per unit.
// Returns the estimate rounded to the nearest ruble, plus the sample size.
export async function estimateAvgDelivery(): Promise<
  { avgPerUnit: number; orderCount: number; unitCount: number } | { error: string }
> {
  try {
    // Yandex API allows max 30 days per request — fetch 3 chunks to cover 90 days.
    const now = Date.now();
    const chunks: { fromDate: Date; toDate: Date }[] = [
      { fromDate: new Date(now - 90 * 24 * 60 * 60 * 1000), toDate: new Date(now - 60 * 24 * 60 * 60 * 1000) },
      { fromDate: new Date(now - 60 * 24 * 60 * 60 * 1000), toDate: new Date(now - 30 * 24 * 60 * 60 * 1000) },
      { fromDate: new Date(now - 30 * 24 * 60 * 60 * 1000), toDate: new Date(now) },
    ];

    const orderArrays = await Promise.all(chunks.map((c) => fetchYandexOrders(c)));
    const orders = orderArrays.flat() as YandexOrder[];
    const real = orders.filter((o) => !o.fake);
    if (real.length === 0) return { error: "Нет заказов за последние 90 дней" };

    const stats = await fetchStats(real.map((o) => o.id));
    const statsById = new Map(stats.map((s) => [s.id, s]));

    let totalFees = 0;
    let totalUnits = 0;
    let orderCount = 0;

    for (const order of real) {
      const stat = statsById.get(order.id);
      // Skip unsettled orders — their commissions array is empty
      if (!stat || (stat.commissions?.length ?? 0) === 0) continue;

      const fees =
        getFee(stat, "DELIVERY_TO_CUSTOMER") +
        getFee(stat, "EXPRESS_DELIVERY_TO_CUSTOMER") +
        getFee(stat, "CROSSREGIONAL_DELIVERY") +
        getFee(stat, "PAYMENT_TRANSFER") +
        getFee(stat, "AGENCY") +
        getFee(stat, "LOYALTY_PARTICIPATION_FEE") +
        getFee(stat, "SORTING");

      const units = order.items.reduce((s, i) => s + i.count, 0);

      totalFees += fees;
      totalUnits += units;
      orderCount++;
    }

    if (totalUnits === 0) return { error: "Нет урегулированных заказов с данными о доставке" };

    return {
      avgPerUnit: Math.round(totalFees / totalUnits),
      orderCount,
      unitCount: totalUnits,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при расчёте" };
  }
}
