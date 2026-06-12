"use server";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

type DebugReturnState = {
  errors?: { _form?: string[] };
  success?: { message: string };
};

function toYandexDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

// Searches the general returns list (past 2 years, paginated) to find a return by ID.
// Returns the full return object including orderId, or null if not found.
async function findReturnById(
  token: string,
  campaignId: string,
  returnId: string
): Promise<{ orderId: number; [key: string]: unknown } | null> {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 2);

  let pageToken: string | undefined;
  do {
    const url = new URL(`${YANDEX_API_BASE}/campaigns/${campaignId}/returns`);
    url.searchParams.set("fromDate", toYandexDate(fromDate));
    url.searchParams.set("toDate", toYandexDate(toDate));
    url.searchParams.set("limit", "50");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const res = await fetch(url.toString(), { headers: { "Api-Key": token } });
    if (!res.ok) throw new Error(`Returns list HTTP ${res.status}`);
    const data = await res.json();

    const returns: { id: number; orderId: number; [key: string]: unknown }[] = data.result?.returns ?? [];
    const found = returns.find((r) => String(r.id) === returnId);
    if (found) return found;

    pageToken = data.result?.pager?.nextPageToken ?? undefined;
  } while (pageToken);

  return null;
}

// Fetches the specific return from the per-order returns endpoint (full detail).
async function fetchReturnDetail(
  token: string,
  campaignId: string,
  orderId: number,
  returnId: string
): Promise<unknown> {
  const res = await fetch(
    `${YANDEX_API_BASE}/campaigns/${campaignId}/orders/${orderId}/returns/${returnId}`,
    { headers: { "Api-Key": token } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(
    data.errors?.map((e: { message: string }) => e.message).join(", ") || `HTTP ${res.status}`
  );
  return data;
}

// Fetches the full order from the orders API.
async function fetchOrder(token: string, campaignId: string, orderId: number): Promise<unknown> {
  const res = await fetch(
    `${YANDEX_API_BASE}/campaigns/${campaignId}/orders/${orderId}`,
    { headers: { "Api-Key": token } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(
    data.errors?.map((e: { message: string }) => e.message).join(", ") || `HTTP ${res.status}`
  );
  return data;
}

// Fetches financial stats for the order from the stats API.
async function fetchOrderStats(token: string, campaignId: string, orderId: number): Promise<unknown> {
  const res = await fetch(`${YANDEX_API_BASE}/campaigns/${campaignId}/stats/orders`, {
    method: "POST",
    headers: { "Api-Key": token, "Content-Type": "application/json" },
    body: JSON.stringify({ orders: [orderId] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(
    data.errors?.map((e: { message: string }) => e.message).join(", ") || `HTTP ${res.status}`
  );
  return data;
}

// Debug server action: accepts a Yandex return ID, finds it in the general returns list
// to extract the orderId, then logs raw data from the return, order, and stats APIs
// to the server console.
export async function debugReturnAction(
  _state: DebugReturnState,
  formData: FormData
): Promise<DebugReturnState> {
  const returnId = String(formData.get("orderId") ?? "").trim();
  if (!returnId) return { errors: { _form: ["Введите ID возврата"] } };

  const token = process.env.YANDEX_API_TOKEN;
  const campaignId = process.env.YANDEX_CAMPAIGN_ID;
  if (!token || !campaignId) {
    return { errors: { _form: ["Не заданы YANDEX_API_TOKEN или YANDEX_CAMPAIGN_ID"] } };
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`=== YANDEX DEBUG: return ${returnId} ===`);
  console.log(`${"=".repeat(70)}`);

  // Step 1: find the return to get orderId
  let returnListItem: { orderId: number; [key: string]: unknown } | null = null;
  try {
    returnListItem = await findReturnById(token, campaignId, returnId);
    if (!returnListItem) {
      console.log(`\n[RETURNS LIST] Return ${returnId} not found in the past 2 years.`);
      console.log(`${"=".repeat(70)}\n`);
      return { errors: { _form: [`Возврат ${returnId} не найден за последние 2 года`] } };
    }
    console.log(`\n[RETURNS LIST] Found return ${returnId}, orderId = ${returnListItem.orderId}`);
    console.log(JSON.stringify(returnListItem, null, 2));
  } catch (err) {
    console.log(`\n[RETURNS LIST] ERROR: ${err instanceof Error ? err.message : err}`);
    console.log(`${"=".repeat(70)}\n`);
    return { errors: { _form: [`Ошибка поиска возврата: ${err instanceof Error ? err.message : err}`] } };
  }

  const orderId = returnListItem.orderId;
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // Step 2: fetch full return detail, order, and stats in parallel
  await Promise.allSettled([
    fetchReturnDetail(token, campaignId, orderId, returnId)
      .then((d) => { results.returnDetail = d; })
      .catch((e: Error) => { errors.returnDetail = e.message; }),
    fetchOrder(token, campaignId, orderId)
      .then((d) => { results.order = d; })
      .catch((e: Error) => { errors.order = e.message; }),
    fetchOrderStats(token, campaignId, orderId)
      .then((d) => { results.stats = d; })
      .catch((e: Error) => { errors.stats = e.message; }),
  ]);

  if (results.returnDetail) { console.log("\n[RETURN DETAIL API]"); console.log(JSON.stringify(results.returnDetail, null, 2)); }
  else { console.log(`\n[RETURN DETAIL API] ERROR: ${errors.returnDetail}`); }

  if (results.order) { console.log("\n[ORDER API]"); console.log(JSON.stringify(results.order, null, 2)); }
  else { console.log(`\n[ORDER API] ERROR: ${errors.order}`); }

  if (results.stats) { console.log("\n[STATS API]"); console.log(JSON.stringify(results.stats, null, 2)); }
  else { console.log(`\n[STATS API] ERROR: ${errors.stats}`); }

  console.log(`\n${"=".repeat(70)}\n`);

  const errorSummary = Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join("; ");
  return errorSummary
    ? { success: { message: `Данные в консоли. Ошибки: ${errorSummary}` } }
    : { success: { message: `Данные по возврату ${returnId} (заказ ${orderId}) выведены в консоль.` } };
}
