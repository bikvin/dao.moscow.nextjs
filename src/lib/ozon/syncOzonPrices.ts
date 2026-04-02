import { db } from "@/db";
import { PriceTypeEnum } from "@prisma/client";

const OZON_API_BASE = "https://api-seller.ozon.ru";

export async function syncOzonPrices(trigger: "AUTO" | "MANUAL"): Promise<void> {
  const clientId = process.env.OZON_CLIENT_ID;
  const apiKey = process.env.OZON_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error("Не заданы переменные окружения OZON_CLIENT_ID или OZON_API_KEY");
  }

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

  const prices = offersWithPrice.map((m) => ({
    offer_id: m.ozonOfferId,
    price: String(Math.round(m.product.prices[0].priceInCents / 100)),
    old_price: "0",
    min_price: "0",
  }));

  const response = await fetch(`${OZON_API_BASE}/v1/product/import/prices`, {
    method: "POST",
    headers: {
      "Client-Id": clientId,
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
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

  type OzonResultItem = { updated: boolean; errors: unknown[] };
  const failed = ((data.result as OzonResultItem[]) ?? []).filter(
    (item) => !item.updated || item.errors?.length > 0
  );

  if (failed.length > 0) {
    const message = `${failed.length} из ${prices.length} SKU не обновлены`;
    await db.ozonPriceSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: prices.length },
    });
    throw new Error(message);
  }

  await db.ozonPriceSyncLog.create({
    data: { status: "SUCCESS", trigger, skuCount: prices.length },
  });
}
