const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

function toYandexDate(date: Date): string {
  // DD-MM-YYYY
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function fetchYandexOrders(options?: {
  fromDate?: Date;
  toDate?: Date;
}): Promise<unknown[]> {
  const token = process.env.YANDEX_API_TOKEN;
  const campaignId = process.env.YANDEX_CAMPAIGN_ID;

  if (!token || !campaignId) {
    throw new Error("Не заданы переменные окружения YANDEX_API_TOKEN или YANDEX_CAMPAIGN_ID");
  }

  const fromDate = options?.fromDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();
  const fromDateStr = toYandexDate(fromDate);
  const toDateStr = options?.toDate ? toYandexDate(options.toDate) : undefined;

  const headers = {
    "Api-Key": token,
    "Content-Type": "application/json",
  };

  const allOrders: unknown[] = [];
  let page = 1;
  const pageSize = 50;

  while (true) {
    const url = new URL(`${YANDEX_API_BASE}/campaigns/${campaignId}/orders`);
    url.searchParams.set("fromDate", fromDateStr);
    if (toDateStr) url.searchParams.set("toDate", toDateStr);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));

    const response = await fetch(url.toString(), { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.errors?.map((e: { message: string }) => e.message).join(", ") ||
        `HTTP ${response.status}`
      );
    }

    const orders: unknown[] = data.orders ?? [];
    allOrders.push(...orders);

    const pager = data.pager;
    if (!pager || page >= Math.ceil(pager.total / pageSize)) break;
    page++;
  }

  return allOrders;
}
