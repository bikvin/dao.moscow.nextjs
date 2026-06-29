import { CurrencyEnum, OrderTypeEnum, PriceUnitEnum } from "@prisma/client";

export type ProfitOrder = {
  orderType: OrderTypeEnum;
  totalRub: number;
  items: { productVariantId: string; quantityM2: number | null }[];
  issues: {
    productVariantId: string;
    quantity: number;
    costPrice: number | null;
    costPriceCurrency: CurrencyEnum | null;
    costPriceUnit: PriceUnitEnum | null;
  }[];
  receipts: {
    productVariantId: string;
    quantity: number;
    price: number | null;
    priceCurrency: CurrencyEnum | null;
    priceUnit: PriceUnitEnum | null;
  }[];
};

export type OrderProfitResult = {
  costRub: number;
  profitRub: number;
  partial: boolean;
} | null;

// Computes COGS and profit/loss in RUB for a single SALE or RETURN order.
// SALE:   profit = revenue - cogs (both positive; result is the margin)
// RETURN: profit = revenue + cogs (revenue is negative; cogs is cost recovered from returned stock)
// Returns null when cost data is missing entirely or the order type is neither SALE nor RETURN.
// `partial` is true when some line items lack cost data — the result is a lower bound.
export function computeOrderProfit(
  order: ProfitOrder,
  usdRate: number | null,
  rmbRate: number | null,
): OrderProfitResult {
  const isSale = order.orderType === OrderTypeEnum.SALE;
  const isReturn = order.orderType === OrderTypeEnum.RETURN;
  if (!isSale && !isReturn) return null;

  const rateFor = (c: CurrencyEnum | null): number | null => {
    if (c === CurrencyEnum.RUB) return 1;
    if (c === CurrencyEnum.USD) return usdRate;
    if (c === CurrencyEnum.RMB) return rmbRate;
    return null;
  };

  const m2ByVariant = new Map<string, number>();
  for (const item of order.items) {
    if (item.quantityM2 != null) {
      m2ByVariant.set(
        item.productVariantId,
        (m2ByVariant.get(item.productVariantId) ?? 0) + item.quantityM2,
      );
    }
  }

  const rows = isSale
    ? order.issues.map((i) => ({
        variantId: i.productVariantId,
        price: i.costPrice,
        currency: i.costPriceCurrency,
        unit: i.costPriceUnit,
        quantity: i.quantity,
      }))
    : order.receipts.map((r) => ({
        variantId: r.productVariantId,
        price: r.price,
        currency: r.priceCurrency,
        unit: r.priceUnit,
        quantity: r.quantity,
      }));

  if (rows.length === 0) return null;

  let costRub = 0;
  let partial = false;

  for (const row of rows) {
    if (row.price == null) { partial = true; continue; }
    const rate = rateFor(row.currency);
    if (rate == null) { partial = true; continue; }
    const isM2 = row.unit === PriceUnitEnum.M2 || (row.unit == null && m2ByVariant.has(row.variantId));
    const qty = isM2 ? (m2ByVariant.get(row.variantId) ?? row.quantity) : row.quantity;
    costRub += qty * row.price * rate;
  }

  if (costRub === 0) return null;

  // Normalise sign: manually created returns store totalRub as positive
  const revenueRub = (isReturn ? -Math.abs(order.totalRub) : order.totalRub) / 100;
  const profitRub = isSale ? revenueRub - costRub : revenueRub + costRub;

  return { costRub, profitRub, partial };
}
