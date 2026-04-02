import { db } from "@/db";
import { CurrencyEnum, PriceTypeEnum, PriceUnitEnum } from "@prisma/client";

export async function recalculateYandexPrice(productId: string): Promise<void> {
  const [product, exchangeRateSetting, markupSetting, divisorSetting] = await Promise.all([
    db.product.findUnique({
      where: { id: productId },
      select: {
        width_mm: true,
        length_mm: true,
        prices: { where: { type: PriceTypeEnum.RETAIL } },
        yandexMarketMappings: { select: { divisor: true, priceMarkup: true } },
      },
    }),
    db.settings.findUnique({ where: { field: "usdMainRate" } }),
    db.settings.findUnique({ where: { field: "yandexDefaultPriceMarkup" } }),
    db.settings.findUnique({ where: { field: "yandexDefaultDivisor" } }),
  ]);

  if (!product || product.yandexMarketMappings.length === 0) return;

  const retail = product.prices[0];
  if (!retail) return;

  const globalMarkup = markupSetting ? parseInt(markupSetting.value, 10) || 0 : 0;
  const globalDivisor = divisorSetting ? parseInt(divisorSetting.value, 10) : null;
  const mainExchangeRate = exchangeRateSetting ? parseFloat(exchangeRateSetting.value) : null;

  const mapping = product.yandexMarketMappings[0];
  const effectiveDivisor = mapping.divisor ?? globalDivisor;
  const workingMarkup = mapping.priceMarkup ?? globalMarkup;

  if (effectiveDivisor == null || effectiveDivisor < 1) return;

  // Price per unit (tile or piece)
  let priceUnit: number;
  if (retail.unit === PriceUnitEnum.M2) {
    const widthM = product.width_mm / 1000;
    const lengthM = product.length_mm / 1000;
    priceUnit = (retail.priceInCents / 100) * widthM * lengthM;
  } else {
    priceUnit = retail.priceInCents / 100;
  }

  // Convert to RUB
  let priceUnitRub: number;
  if (retail.currency === CurrencyEnum.RUB) {
    priceUnitRub = priceUnit;
  } else {
    if (mainExchangeRate == null) return;
    priceUnitRub = priceUnit * mainExchangeRate;
  }

  const multiplier = 1 + workingMarkup / 100;
  const priceYandex = priceUnitRub * effectiveDivisor * multiplier;
  const priceInCents = Math.round(priceYandex * 100);

  await db.price.upsert({
    where: { productId_type: { productId, type: PriceTypeEnum.YANDEX } },
    update: { priceInCents, currency: CurrencyEnum.RUB, unit: PriceUnitEnum.ITEM, quantity: effectiveDivisor },
    create: { productId, type: PriceTypeEnum.YANDEX, priceInCents, currency: CurrencyEnum.RUB, unit: PriceUnitEnum.ITEM, quantity: effectiveDivisor },
  });
}
