"use server";

import { db } from "@/db";
import { fetchYandexOrders } from "@/lib/yandex/fetchYandexOrders";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

type YandexOrder = {
  id: number;
  status: string;
  creationDate: string;
  itemsTotal: number;
  buyerTotal: number;
  buyerTotalBeforeDiscount: number;
  subsidies?: { type: string; amount: number }[];
  items?: { offerId: string; offerName: string; count: number; price: number }[];
  fake: boolean;
};

type OrderStat = {
  id: number;
  commissions?: { type: string; actual: number }[];
  payments?: { type: string; source: string; total: number }[];
  subsidies?: { type: string; operationType: string; amount: number }[];
};

type FetchOrdersState = {
  errors?: { _form?: string[] };
  success?: { message: string };
};

// Fetches financial stats from Yandex stats API for a list of order IDs.
async function fetchOrderStats(orderIds: number[]): Promise<OrderStat[]> {
  const token = process.env.YANDEX_API_TOKEN;
  const campaignId = process.env.YANDEX_CAMPAIGN_ID;

  if (!token || !campaignId) {
    throw new Error("Не заданы переменные окружения YANDEX_API_TOKEN или YANDEX_CAMPAIGN_ID");
  }

  const allStats: OrderStat[] = [];
  // API allows max 200 per request
  for (let i = 0; i < orderIds.length; i += 200) {
    const chunk = orderIds.slice(i, i + 200);
    const response = await fetch(
      `${YANDEX_API_BASE}/campaigns/${campaignId}/stats/orders`,
      {
        method: "POST",
        headers: { "Api-Key": token, "Content-Type": "application/json" },
        body: JSON.stringify({ orders: chunk }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.errors?.map((e: { message: string }) => e.message).join(", ") ||
        `HTTP ${response.status}`
      );
    }
    allStats.push(...(data.result?.orders ?? []));
  }
  return allStats;
}

// Debug action: fetches last 30 days of Yandex orders and logs raw API data + net calculations
// to the server console. Also reads commissionRate and avgDelivery from Settings to mirror
// the calcNet formula used on the import screen.
export async function fetchOrdersAction(
  _state: FetchOrdersState,
  _formData: FormData
): Promise<FetchOrdersState> {
  try {
    const [commissionRateSetting, avgDeliverySetting] = await Promise.all([
      db.settings.findUnique({ where: { field: "yandexCommissionRate" } }),
      db.settings.findUnique({ where: { field: "yandexAverageDeliveryRub" } }),
    ]);
    const commissionRate = commissionRateSetting ? parseFloat(commissionRateSetting.value) : 0;
    const avgDelivery = avgDeliverySetting ? parseFloat(avgDeliverySetting.value) : 0;

    // Fetch last 7 days
    const orders = (await fetchYandexOrders({
      fromDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })) as YandexOrder[];
    const nonFake = orders.filter((o) => !o.fake);

    const orderIds = nonFake.map((o) => o.id);
    const stats = await fetchOrderStats(orderIds);
    const statsById = new Map(stats.map((s) => [s.id, s]));

    console.log(`\n${"=".repeat(60)}`);
    console.log(`=== YANDEX DEBUG: ${nonFake.length} orders | commissionRate=${commissionRate}% | avgDelivery=${avgDelivery} ₽/шт ===`);
    console.log(`${"=".repeat(60)}`);

    nonFake.forEach((o) => {
      const stat = statsById.get(o.id);
      const subsidyTotal = o.subsidies?.reduce((s, x) => s + x.amount, 0) ?? 0;
      const sellPrice = o.buyerTotal + subsidyTotal;
      const totalUnits = o.items?.reduce((s, i) => s + i.count, 0) ?? 0;
      const feesSettled = (stat?.commissions?.length ?? 0) > 0;

      // --- Raw Yandex data ---
      console.log(`\n--- Order ${o.id} | ${o.creationDate} | ${o.status} ---`);

      // Log delivery date fields to help identify which field holds the planned shipment date
      const delivery = (o as { delivery?: { dates?: Record<string, string>; shipments?: { shipmentDate?: string }[] } }).delivery;
      console.log("[DELIVERY DATES]", JSON.stringify({
        "delivery.dates": delivery?.dates ?? null,
        "shipments[0].shipmentDate": delivery?.shipments?.[0]?.shipmentDate ?? null,
      }, null, 2));

      console.log("[RAW ORDER]", JSON.stringify(o, null, 2));
      if (stat) {
        console.log("[RAW STATS]", JSON.stringify(stat, null, 2));
      } else {
        console.log("[RAW STATS] no stats data (order not yet settled)");
      }

      // --- Calculations (mirrors calcNet in ImportOrdersClient) ---
      const grossFee = (sellPrice * commissionRate) / 100;
      console.log("\n[CALC]");
      console.log(`  buyerTotal:              ${o.buyerTotal} ₽`);
      console.log(`  buyerTotalBeforeDiscount:${o.buyerTotalBeforeDiscount} ₽`);
      console.log(`  subsidyTotal:            ${subsidyTotal} ₽`);
      console.log(`  sellPrice (buyer+subsidy):${sellPrice} ₽`);
      console.log(`  grossFee (${commissionRate}%):        ${grossFee.toFixed(2)} ₽`);
      console.log(`  totalUnits:              ${totalUnits}`);
      console.log(`  feesSettled:             ${feesSettled}`);

      if (feesSettled && stat?.commissions) {
        const f = stat.commissions;
        const getFee = (type: string) => f.find((c) => c.type === type)?.actual ?? 0;
        const delivery = getFee("DELIVERY_TO_CUSTOMER");
        const expressDelivery = getFee("EXPRESS_DELIVERY_TO_CUSTOMER");
        const crossDelivery = getFee("CROSSREGIONAL_DELIVERY");
        const paymentTransfer = getFee("PAYMENT_TRANSFER");
        const agency = getFee("AGENCY");
        const loyalty = getFee("LOYALTY_PARTICIPATION_FEE");
        const sorting = getFee("SORTING");
        const otherFees = delivery + expressDelivery + crossDelivery + paymentTransfer + agency + loyalty + sorting;
        const net = Math.round(sellPrice - grossFee - otherFees);
        console.log(`  delivery:                ${delivery} ₽`);
        console.log(`  expressDelivery:         ${expressDelivery} ₽`);
        console.log(`  crossDelivery:           ${crossDelivery} ₽`);
        console.log(`  paymentTransfer:         ${paymentTransfer} ₽`);
        console.log(`  agency:                  ${agency} ₽`);
        console.log(`  loyalty:                 ${loyalty} ₽`);
        console.log(`  sorting:                 ${sorting} ₽`);
        console.log(`  otherFees total:         ${otherFees} ₽`);
        console.log(`  NET (факт):              ${net} ₽  (${((100 * (sellPrice - net)) / sellPrice).toFixed(1)}% издержки)`);
      } else {
        const estimatedDelivery = avgDelivery * totalUnits;
        const net = Math.round(sellPrice - grossFee - estimatedDelivery);
        console.log(`  avgDelivery × units:     ${avgDelivery} × ${totalUnits} = ${estimatedDelivery} ₽`);
        console.log(`  NET (оценка):            ${net} ₽  (${((100 * (sellPrice - net)) / sellPrice).toFixed(1)}% издержки)`);
      }
    });

    // Compact summary at the bottom so it's always visible (terminal buffer cuts off the top)
    console.log("\n=== DELIVERY DATES SUMMARY ===");
    nonFake.forEach((o) => {
      const d = (o as { delivery?: { dates?: Record<string, string>; shipments?: { shipmentDate?: string }[] } }).delivery;
      console.log(
        `  ${o.id} | ${o.status.padEnd(25)} | shipment: ${d?.shipments?.[0]?.shipmentDate ?? "null"} | dates.fromDate: ${d?.dates?.fromDate ?? "null"}`
      );
    });
    console.log(`${"=".repeat(60)}\n`);

    return { success: { message: `Получено ${nonFake.length} заказов. Смотрите консоль сервера.` } };
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }
}
