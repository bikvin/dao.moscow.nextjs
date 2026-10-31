const OZON_API_BASE = "https://api-seller.ozon.ru";

export type OzonPostingProduct = {
  offer_id: string;
  sku: number;
  name: string;
  quantity: number;
  price: string; // decimal string from v3 get endpoint; v4 list returns object — normalised on fetch
  is_marketplace_buyout?: boolean;
};

export type OzonPostingFinancialProduct = {
  product_id: number;
  commission: { amount: number; percent: number } | null; // null for very old postings
  payout: number;            // gross seller revenue after commission
  price: number;             // final buyer price
  old_price: number;         // price before discount
  quantity: number;
  // Derived convenience accessors (populated after fetch)
  commission_amount: number;
  commission_percent: number;
};

export type OzonPosting = {
  posting_number: string;
  order_id: number;
  status: string;
  in_process_at: string;     // ISO date — when order entered processing
  shipment_date: string;     // ISO date — warehouse handoff deadline
  delivering_date: string | null;
  is_marketplace_buyout: boolean; // true for cross-border EAEU orders where Ozon buys the goods
  products: OzonPostingProduct[];
  financial_data: {
    products: OzonPostingFinancialProduct[];
  } | null;
  analytics_data: {
    city: string;
    region: string;
  } | null;
};

// Normalises a v4 posting response to the shared OzonPosting shape:
// - flattens commission object to commission_amount / commission_percent
// - normalises products[].price from { amount, currency } object to decimal string
// - hoists is_marketplace_buyout from product level to posting level (true if any product has it)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseV4Posting(p: any): OzonPosting {
  const products: OzonPostingProduct[] = (p.products ?? []).map((i: any) => ({
    offer_id: i.offer_id,
    sku: i.sku,
    name: i.name,
    quantity: i.quantity,
    price: typeof i.price === "object" ? (i.price?.amount ?? "0") : String(i.price ?? "0"),
    is_marketplace_buyout: i.is_marketplace_buyout ?? false,
  }));

  const financialProducts: OzonPostingFinancialProduct[] = (p.financial_data?.products ?? []).map((fp: any) => ({
    product_id: fp.product_id,
    commission: fp.commission ?? null,
    commission_amount: fp.commission?.amount ?? 0,
    commission_percent: fp.commission?.percent ?? 0,
    payout: fp.payout ?? 0,
    price: fp.price ?? 0,
    old_price: fp.old_price ?? 0,
    quantity: fp.quantity ?? 0,
  }));

  return {
    posting_number: p.posting_number,
    order_id: p.order_id,
    status: p.status,
    in_process_at: p.in_process_at,
    shipment_date: p.shipment_date,
    delivering_date: p.delivering_date ?? null,
    is_marketplace_buyout: products.some((i) => i.is_marketplace_buyout === true),
    products,
    financial_data: p.financial_data ? { products: financialProducts } : null,
    analytics_data: p.analytics_data ?? null,
  };
}

// Fetches FBS postings from Ozon for a given date range with financial and analytics data.
// Paginates automatically (1000 per page, Ozon max) using v4 cursor-based pagination.
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
  let cursor: string | undefined;
  const limit = 100;

  while (true) {
    const body: Record<string, unknown> = {
      dir: "DESC",
      filter: {
        since: fromDate.toISOString(),
        to: toDate.toISOString(),
        ...(options?.status ? { status: options.status } : {}),
      },
      limit,
      with: {
        financial_data: true,
        analytics_data: true,
      },
      ...(cursor ? { cursor } : {}),
    };

    const response = await fetch(`${OZON_API_BASE}/v4/posting/fbs/list`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `HTTP ${response.status}`;
      try { message = JSON.parse(text).message || message; } catch { /* non-JSON body */ }
      throw new Error(message);
    }

    const data = await response.json();
    // v4: top-level { has_next, cursor, postings[] } — no result wrapper
    const raw: OzonPosting[] = (data.postings ?? []).map(normaliseV4Posting);
    allPostings.push(...raw);

    if (!data.has_next) break;
    cursor = data.cursor;
  }

  return allPostings;
}

// Fetches individual postings by their posting numbers using /v3/posting/fbs/get.
// Used as a fallback for old finalized postings that no longer appear in the list endpoint.
export async function fetchOzonPostingsByNumbers(postingNumbers: string[]): Promise<OzonPosting[]> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) return [];

  const headers = {
    "Client-Id": clientId,
    "Api-Key": apiKey,
    "Content-Type": "application/json",
  };

  const results: OzonPosting[] = [];

  for (const postingNumber of postingNumbers) {
    try {
      const res = await fetch(`${OZON_API_BASE}/v3/posting/fbs/get`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          posting_number: postingNumber,
          with: { financial_data: true, analytics_data: true },
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const posting: OzonPosting | null = data.result ?? null;
      if (posting) results.push(posting);
    } catch {
      // Skip individual failures — network blip or posting not found
    }
  }

  return results;
}
