import { db } from "@/db";
import { PriceTypeEnum } from "@prisma/client";

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru/v2";

export async function syncYandexPrices(trigger: "AUTO" | "MANUAL"): Promise<void> {
  const token = process.env.YANDEX_API_TOKEN;
  const campaignId = process.env.YANDEX_CAMPAIGN_ID;

  if (!token || !campaignId) {
    throw new Error("Не заданы переменные окружения YANDEX_API_TOKEN или YANDEX_CAMPAIGN_ID");
  }

  // Fetch all mappings with the product's YANDEX price
  const mappings = await db.yandexMarketMapping.findMany({
    include: {
      product: {
        include: { prices: { where: { type: PriceTypeEnum.YANDEX } } },
      },
    },
  });

  const offersWithPrice = mappings.filter((m) => m.product.prices.length > 0);

  if (offersWithPrice.length === 0) {
    await db.yandexPriceSyncLog.create({
      data: { status: "SUCCESS", trigger, message: "Нет цен для синхронизации", skuCount: 0 },
    });
    return;
  }

  const offers = offersWithPrice.map((m) => ({
    id: m.yandexSku,
    price: {
      value: Math.round(m.product.prices[0].priceInCents / 100),
      currencyId: "RUR",
    },
  }));

  const response = await fetch(
    `${YANDEX_API_BASE}/campaigns/${campaignId}/offer-prices/updates`,
    {
      method: "POST",
      headers: {
        "Api-Key": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offers }),
    }
  );

  const data = await response.json();

  if (!response.ok || data.status !== "OK") {
    const message =
      data.errors?.map((e: { message: string }) => e.message).join(", ") ||
      `HTTP ${response.status}`;
    await db.yandexPriceSyncLog.create({
      data: { status: "ERROR", trigger, message, skuCount: offers.length },
    });
    throw new Error(message);
  }

  await db.yandexPriceSyncLog.create({
    data: { status: "SUCCESS", trigger, skuCount: offers.length },
  });
}
