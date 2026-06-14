"use server";

const OZON_API_BASE = "https://api-seller.ozon.ru";

type DebugState = {
  errors?: { _form?: string[] };
  success?: { message: string };
};

// Debug action: fetches the last 6 months of FBS returns from Ozon and logs
// the full raw API response (including all fields per return and per product)
// to the server console. Used to discover the exact response shape before building
// the real import flow.
export async function debugOzonReturnsAction(
  _state: DebugState,
  _formData: FormData
): Promise<DebugState> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) {
    return { errors: { _form: ["Не заданы OZON_CLIENT_ID или OZON_API_KEY"] } };
  }

  const headers = {
    "Client-Id": clientId,
    "Api-Key": apiKey,
    "Content-Type": "application/json",
  };

  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);

  console.log("\n" + "=".repeat(70));
  console.log("=== OZON DEBUG: /v1/returns/list (last 6 months, FBS) ===");
  console.log("=".repeat(70));

  // Correct endpoint: /v1/returns/list (handles both FBO and FBS)
  // Pagination uses last_id cursor (not page/offset). Max limit 500.
  // Only one date filter allowed at a time.
  const body = {
    filter: {
      logistic_return_date: {
        time_from: from.toISOString(),
        time_to: to.toISOString(),
      },
      return_schema: "FBS",
    },
    limit: 500,
    last_id: 0,
  };

  console.log("\n[REQUEST]", `POST ${OZON_API_BASE}/v1/returns/list`);
  console.log(JSON.stringify(body, null, 2));

  const res = await fetch(`${OZON_API_BASE}/v1/returns/list`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();

  console.log(`\n[RESPONSE] HTTP ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  console.log("=".repeat(70) + "\n");

  if (!res.ok) {
    return { errors: { _form: [`HTTP ${res.status} — подробности в консоли сервера`] } };
  }

  const returns: unknown[] = data.returns ?? [];
  return {
    success: {
      message: `HTTP ${res.status}. Возвратов найдено: ${returns.length}. Данные в консоли сервера.`,
    },
  };
}
