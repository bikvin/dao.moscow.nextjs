const OZON_API_BASE = "https://api-seller.ozon.ru";

export type OzonPostingProduct = {
  offer_id: string;
  sku: number;
  name: string;
  quantity: number;
  price: string; // decimal string, e.g. "2410.0000"
};

export type OzonPostingFinancialProduct = {
  product_id: number;
  commission_amount: number; // negative — Ozon's commission
  commission_percent: number;
  payout: number;            // gross seller revenue after commission
  price: number;             // final buyer price
  old_price: number;         // price before discount
  quantity: number;
};

export type OzonPosting = {
  posting_number: string;
  order_id: number;
  status: string;
  in_process_at: string;     // ISO date — when order entered processing
  shipment_date: string;     // ISO date — warehouse handoff deadline
  delivering_date: string | null;
  products: OzonPostingProduct[];
  financial_data: {
    products: OzonPostingFinancialProduct[];
  } | null;
  analytics_data: {
    city: string;
    region: string;
  } | null;
};

// Fetches FBS postings from Ozon for a given date range with financial and analytics data.
// Paginates automatically (1000 per page, Ozon max).
export async function fetchOzonPostings(options?: {
  fromDate?: Date;
  toDate?: Date;
  status?: string;
}): Promise<OzonPosting[]> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error("Не заданы переменные окружения OZON_CLIENT_ID или OZON_API_KEY");
  }

  const fromDate = options?.fromDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();
  const toDate = options?.toDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

  const headers = {
    "Client-Id": clientId,
    "Api-Key": apiKey,
    "Content-Type": "application/json",
  };

  const allPostings: OzonPosting[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const body: Record<string, unknown> = {
      dir: "DESC",
      filter: {
        since: fromDate.toISOString(),
        to: toDate.toISOString(),
        ...(options?.status ? { status: options.status } : {}),
      },
      limit,
      offset,
      with: {
        financial_data: true,
        analytics_data: true,
      },
    };

    const response = await fetch(`${OZON_API_BASE}/v3/posting/fbs/list`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    const postings: OzonPosting[] = data.result?.postings ?? [];
    allPostings.push(...postings);

    if (postings.length < limit) break;
    offset += limit;
  }

  return allPostings;
}
