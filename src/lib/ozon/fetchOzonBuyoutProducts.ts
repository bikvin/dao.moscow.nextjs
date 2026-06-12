const OZON_API_BASE = "https://api-seller.ozon.ru";

// Max date window for /v1/finance/products/buyout (31 days, same as transaction API).
const MAX_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

export type OzonBuyoutProduct = {
  name: string;
  offer_id: string;
  sku: number;
  posting_number: string;
  seller_price_per_instance: number; // seller listed price per unit (= buyer-visible price)
  deduction_by_category_percent: number; // Ozon's buyout discount % on seller price
  buyout_price: number; // price Ozon pays per unit (seller_price × (1 - deduction/100))
  vat_percent: number;
  quantity: number;
  amount: number; // total payout to seller = buyout_price × quantity
};

// Fetches one window of buyout product data (must be ≤31 days).
async function fetchBuyoutWindow(
  clientId: string,
  apiKey: string,
  from: Date,
  to: Date
): Promise<OzonBuyoutProduct[]> {
  const res = await fetch(`${OZON_API_BASE}/v1/finance/products/buyout`, {
    method: "POST",
    headers: {
      "Client-Id": clientId,
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date_from: from.toISOString().slice(0, 10),
      date_to: to.toISOString().slice(0, 10),
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.products ?? [];
}

// Fetches Ozon buyout product report for a date range, splitting into ≤31-day windows.
// Returns products grouped by posting_number for easy lookup.
export async function fetchOzonBuyoutProducts(
  fromDate: Date,
  toDate: Date
): Promise<Map<string, OzonBuyoutProduct[]>> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) return new Map();

  const allProducts: OzonBuyoutProduct[] = [];
  let windowStart = new Date(fromDate);

  while (windowStart < toDate) {
    const windowEnd = new Date(Math.min(windowStart.getTime() + MAX_WINDOW_MS, toDate.getTime()));
    const chunk = await fetchBuyoutWindow(clientId, apiKey, windowStart, windowEnd);
    allProducts.push(...chunk);
    windowStart = new Date(windowEnd.getTime() + 1);
  }

  const byPosting = new Map<string, OzonBuyoutProduct[]>();
  for (const product of allProducts) {
    if (!byPosting.has(product.posting_number)) byPosting.set(product.posting_number, []);
    byPosting.get(product.posting_number)!.push(product);
  }
  return byPosting;
}
