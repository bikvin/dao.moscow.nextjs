const OZON_API_BASE = "https://api-seller.ozon.ru";

// Settled accruals for a single posting, computed from the new /v1/finance/accrual/postings API.
export type OzonPostingAccruals = {
  posting_number: string;
  // True when Ozon has recorded any accruals for this posting (fees are finalized).
  isSettled: boolean;
  // Sum of absolute-valued negative non-product accruals (sku === 0). Represents total service
  // fees charged by Ozon (logistics, dropoff, acquiring, etc.) for this posting.
  totalFeesRub: number;
};

// Queries /v1/finance/accrual/postings for the given posting numbers (batched by 200).
// Returns a map of posting_number → settled accruals. Postings not yet processed by Ozon
// are absent from the map (isSettled would be false).
export async function fetchOzonAccrualsByPosting(
  postingNumbers: string[]
): Promise<Map<string, OzonPostingAccruals>> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;
  if (!clientId || !apiKey) return new Map();

  const result = new Map<string, OzonPostingAccruals>();

  for (let i = 0; i < postingNumbers.length; i += 200) {
    const batch = postingNumbers.slice(i, i + 200);
    const res = await fetch(`${OZON_API_BASE}/v1/finance/accrual/postings`, {
      method: "POST",
      headers: {
        "Client-Id": clientId,
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ posting_numbers: batch }),
    });

    if (!res.ok) continue;

    const data = await res.json();
    const postingAccruals: {
      posting_number: string;
      accruals: { accrued: { amount: string }; sku: number }[];
    }[] = data.posting_accruals ?? [];

    for (const pa of postingAccruals) {
      // Service fees have sku === 0; product entries (sale credits/debits) have sku > 0.
      const totalFeesRub = pa.accruals
        .filter((a) => a.sku === 0 && parseFloat(a.accrued.amount) < 0)
        .reduce((sum, a) => sum + Math.abs(parseFloat(a.accrued.amount)), 0);

      result.set(pa.posting_number, {
        posting_number: pa.posting_number,
        isSettled: pa.accruals.length > 0,
        totalFeesRub,
      });
    }
  }

  return result;
}
