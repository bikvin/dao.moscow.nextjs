"use server";

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

export async function fetchOrdersAction(
  _state: FetchOrdersState,
  _formData: FormData
): Promise<FetchOrdersState> {
  try {
    // Fetch April orders (settled and paid out by now)
    const orders = (await fetchYandexOrders({
      fromDate: new Date("2026-04-01"),
      toDate: new Date("2026-04-30"),
    })) as YandexOrder[];
    const nonFake = orders.filter((o) => !o.fake);

    const orderIds = nonFake.map((o) => o.id);
    const stats = await fetchOrderStats(orderIds);
    const statsById = new Map(stats.map((s) => [s.id, s]));

    console.log("\n=== Per-order financials ===");
    nonFake.forEach((o) => {
      const stat = statsById.get(o.id);
      const subsidy = o.subsidies?.reduce((s, x) => s + x.amount, 0) ?? 0;
      const grossBeforeCommission = o.buyerTotalBeforeDiscount;

      const fee = stat?.commissions?.find((c) => c.type === "FEE")?.actual ?? null;
      const delivery = stat?.commissions?.find((c) => c.type === "DELIVERY_TO_CUSTOMER")?.actual ?? null;
      const expressDelivery = stat?.commissions?.find((c) => c.type === "EXPRESS_DELIVERY_TO_CUSTOMER")?.actual ?? null;
      const allCommissions = stat?.commissions ?? [];

      const totalDeductions = (fee ?? 0) + (delivery ?? 0) + (expressDelivery ?? 0);
      const net = stat ? grossBeforeCommission - totalDeductions : null;

      console.log(
        `\nOrder ${o.id} | ${o.creationDate} | ${o.status}` +
        `\n  buyerPaid:      ${o.buyerTotal} ₽` +
        `\n  gross (before discount): ${grossBeforeCommission} ₽  subsidy: ${subsidy} ₽` +
        `\n  FEE commission: ${fee ?? "n/a"} ₽` +
        `\n  delivery cost:  ${delivery ?? "n/a"} ₽` +
        `\n  express delivery: ${expressDelivery ?? "n/a"} ₽` +
        `\n  net (estimate): ${net ?? "n/a"} ₽` +
        (allCommissions.length > 0
          ? `\n  all commissions: ${JSON.stringify(allCommissions)}`
          : "")
      );
    });

    return { success: { message: `Получено ${nonFake.length} заказов + финансовые данные. Смотрите консоль сервера.` } };
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }
}
