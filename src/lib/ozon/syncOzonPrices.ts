import { db } from "@/db";
import { PriceTypeEnum } from "@prisma/client";

const OZON_API_BASE = "https://api-seller.ozon.ru";

export async function syncOzonPrices(trigger: "AUTO" | "MANUAL"): Promise<void> {
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

  // Fetch all mappings with the product's OZON price
  const mappings = await db.ozonMapping.findMany({
    include: {
      product: {
        include: { prices: { where: { type: PriceTypeEnum.OZON } } },
      },
    },
  });

  const offersWithPrice = mappings.filter((m) => m.product.prices.length > 0);

  if (offersWithPrice.length === 0) {
    await db.ozonPriceSyncLog.create({
      data: { status: "SUCCESS", trigger, message: "Нет цен для синхронизации", skuCount: 0 },
    });
    return;
  }

  const prices = offersWithPrice.map((m) => {
    const priceValue = String(Math.round(m.product.prices[0].priceInCents / 100));
    return {
      offer_id: m.ozonOfferId,
      price: priceValue,
      old_price: "0",
      min_price: priceValue,
      auto_action_enabled: "DISABLED",
      auto_add_to_ozon_actions_list_enabled: "DISABLED",
      manage_elastic_boosting_through_price: false,
      min_price_for_auto_actions_enabled: true,
    };
  });

  const response = await fetch(`${OZON_API_BASE}/v1/product/import/prices`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prices }),
  });

  const rawText = await response.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    const message = `Ozon вернул невалидный ответ (HTTP ${response.status}): ${rawText.slice(0, 300)}`;
    await db.ozonPriceSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: prices.length },
    });
    throw new Error(message);
  }

  if (!response.ok) {
    const message = (data.message as string) || `HTTP ${response.status}`;
    await db.ozonPriceSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: prices.length },
    });
    throw new Error(message);
  }

  type OzonResultItem = { product_id: number; updated: boolean; errors: unknown[] };
  const results = (data.result as OzonResultItem[]) ?? [];
  const failed = results.filter((item) => !item.updated || item.errors?.length > 0);

  if (failed.length > 0) {
    const message = `${failed.length} из ${prices.length} SKU не обновлены`;
    await db.ozonPriceSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: prices.length },
    });
    throw new Error(message);
  }

  // Update min_price timer for all successfully updated products
  const productIds = results.filter((r) => r.updated).map((r) => r.product_id);
  if (productIds.length > 0) {
    await fetch(`${OZON_API_BASE}/v1/product/action/timer/update`, {
      method: "POST",
      headers,
      body: JSON.stringify({ product_ids: productIds }),
    });
  }

  await db.ozonPriceSyncLog.create({
    data: { status: "SUCCESS", trigger, skuCount: prices.length },
  });
}
