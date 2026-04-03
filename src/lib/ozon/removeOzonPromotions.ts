const OZON_API_BASE = "https://api-seller.ozon.ru";

type OzonAction = { id: number; is_participating: boolean; potential_products_count: number; participating_products_count: number };
type OzonProduct = { id: number };

async function fetchAllProductIds(
  endpoint: string,
  actionId: number,
  headers: Record<string, string>
): Promise<number[]> {
  const ids: number[] = [];
  let lastId: string | undefined = undefined;

  while (true) {
    const body: Record<string, unknown> = { action_id: actionId, limit: 100 };
    if (lastId) body.last_id = lastId;

    const res = await fetch(`${OZON_API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const products: OzonProduct[] = data.result?.products ?? [];

    for (const p of products) ids.push(p.id);

    lastId = data.result?.last_id;
    if (products.length < 100) break;
  }

  return ids;
}

export async function removeOzonPromotions(): Promise<{ removed: number; promotions: number }> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error("Не заданы переменные окружения OZON_CLIENT_ID или OZON_API_KEY");
  }

  const headers = {
    "Client-Id": clientId,
    "Api-Key": apiKey,
    "Content-Type": "application/json",
  };

  // 1. Get all promotions — include ones with candidates even if not yet participating
  const actionsRes = await fetch(`${OZON_API_BASE}/v1/actions`, { headers });
  const actionsData = await actionsRes.json();
  const relevantActions: OzonAction[] = (actionsData.result ?? []).filter(
    (a: OzonAction) =>
      a.is_participating ||
      a.potential_products_count > 0 ||
      a.participating_products_count > 0
  );

  if (relevantActions.length === 0) {
    return { removed: 0, promotions: 0 };
  }

  let totalRemoved = 0;
  let affectedPromotions = 0;

  for (const action of relevantActions) {
    // Collect both participating products and candidates
    const [participatingIds, candidateIds] = await Promise.all([
      fetchAllProductIds("/v1/actions/products", action.id, headers),
      fetchAllProductIds("/v1/actions/candidates", action.id, headers),
    ]);

    // Deduplicate
    const allIds = [...new Set([...participatingIds, ...candidateIds])];
    if (allIds.length === 0) continue;

    await fetch(`${OZON_API_BASE}/v1/actions/products/deactivate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action_id: action.id, product_ids: allIds }),
    });

    totalRemoved += allIds.length;
    affectedPromotions++;
  }

  return { removed: totalRemoved, promotions: affectedPromotions };
}
