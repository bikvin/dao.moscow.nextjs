import { db } from "@/db";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

export async function syncYandexStock(
  trigger: "AUTO" | "MANUAL"
): Promise<void> {
  const token = process.env.YANDEX_API_TOKEN;
  const campaignId = process.env.YANDEX_CAMPAIGN_ID;

  if (!token || !campaignId) {
    throw new Error(
      "Не заданы переменные окружения YANDEX_API_TOKEN или YANDEX_CAMPAIGN_ID"
    );
  }

  // Read global default buffer from Settings
  const bufferSetting = await db.settings.findUnique({
    where: { field: "yandexDefaultBuffer" },
  });
  const globalBuffer = bufferSetting ? parseInt(bufferSetting.value, 10) || 0 : 0;

  // Fetch all mappings with product variants
  const mappings = await db.yandexMarketMapping.findMany({
    include: {
      product: {
        include: { productVariants: { select: { availableQuantity: true } } },
      },
    },
  });

  if (mappings.length === 0) {
    await db.yandexSyncLog.create({
      data: { status: "SUCCESS", trigger, message: "Нет маппингов для синхронизации", skuCount: 0 },
    });
    return;
  }

  const skus = mappings.map((mapping) => {
    const totalAvailable = mapping.product.productVariants.reduce(
      (sum, v) => sum + v.availableQuantity,
      0
    );
    const effectiveBuffer = mapping.buffer ?? globalBuffer;
    const count = Math.max(0, Math.floor((totalAvailable - effectiveBuffer) / 3));
    return { sku: mapping.yandexSku, items: [{ count }] };
  });

  const response = await fetch(
    `${YANDEX_API_BASE}/campaigns/${campaignId}/offers/stocks`,
    {
      method: "PUT",
      headers: {
        "Api-Key": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ skus }),
    }
  );

  const data = await response.json();

  if (!response.ok || data.status !== "OK") {
    const message =
      data.errors?.map((e: { message: string }) => e.message).join(", ") ||
      `HTTP ${response.status}`;
    await db.yandexSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: skus.length },
    });
    throw new Error(message);
  }

  await db.yandexSyncLog.create({
    data: { status: "SUCCESS", trigger, skuCount: skus.length },
  });
}
