const OZON_API_BASE = "https://api-seller.ozon.ru";

// Ozon transaction API allows at most 31 days per request.
const MAX_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

export type OzonTransaction = {
  operation_type: string;
  posting: { posting_number: string };
  accruals_for_sale: number;
  sale_commission: number;
  amount: number;
  services: { name: string; price: number }[];
};

export function getOzonService(
  services: { name: string; price: number }[],
  name: string
): number {
  return services.find((s) => s.name === name)?.price ?? 0;
}

// Fetches one page window of transactions from Ozon (must be ≤31 days).
async function fetchTransactionWindow(
  clientId: string,
  apiKey: string,
  from: Date,
  to: Date,
  postingSet: Set<string>
): Promise<OzonTransaction[]> {
  const results: OzonTransaction[] = [];
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
          date: { from: from.toISOString(), to: to.toISOString() },
          transaction_type: "all",
        },
        page,
        page_size: 1000,
      }),
    });

    const data = await res.json();
    if (!res.ok) break;

    const ops: OzonTransaction[] = data.result?.operations ?? [];
    results.push(...ops.filter((op) => postingSet.has(op.posting?.posting_number)));

    if (page >= (data.result?.page_count ?? 1)) break;
    page++;
  }

  return results;
}

// Fetches Ozon financial transactions for a date range, filtered to the given posting numbers.
// Splits into 31-day chunks automatically (Ozon API limit).
// Posting number filtering is done client-side since the API doesn't support it.
export async function fetchOzonTransactions(
  fromDate: Date,
  toDate: Date,
  postingNumbers: string[]
): Promise<OzonTransaction[]> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) return [];

  const postingSet = new Set(postingNumbers);
  const results: OzonTransaction[] = [];

  // Walk through the date range in 31-day windows
  let windowStart = new Date(fromDate);
  while (windowStart < toDate) {
    const windowEnd = new Date(Math.min(windowStart.getTime() + MAX_WINDOW_MS, toDate.getTime()));
    const chunk = await fetchTransactionWindow(clientId, apiKey, windowStart, windowEnd, postingSet);
    results.push(...chunk);
    windowStart = new Date(windowEnd.getTime() + 1);
  }

  return results;
}
