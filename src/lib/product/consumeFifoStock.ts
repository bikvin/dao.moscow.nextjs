import { CurrencyEnum, PriceUnitEnum } from "@prisma/client";
import { db } from "@/db";

type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type FifoCost = {
  costPrice: number;
  costPriceCurrency: CurrencyEnum;
  costPriceUnit: PriceUnitEnum;
} | null;

// Consumes `quantity` units from the oldest available receipts (FIFO) for a given variant.
// Decrements quantityLeft on each receipt inside the transaction.
// Returns the weighted average unit cost if all consumed receipts share a single currency and unit, otherwise null.
export async function consumeFifoStock(
  tx: TransactionClient,
  productVariantId: string,
  quantity: number
): Promise<FifoCost> {
  const receipts = await tx.productReceipt.findMany({
    where: { productVariantId, quantityLeft: { gt: 0 } },
    orderBy: [{ receiptDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, quantityLeft: true, price: true, priceCurrency: true, priceUnit: true },
  });

  let remaining = quantity;
  let totalCost = 0;
  let totalPricedQty = 0;
  let currency: CurrencyEnum | null = null;
  let unit: PriceUnitEnum | null = null;
  let mixedCurrencies = false;
  let mixedUnits = false;

  for (const receipt of receipts) {
    if (remaining <= 0) break;

    const consume = Math.min(receipt.quantityLeft, remaining);
    remaining -= consume;

    await tx.productReceipt.update({
      where: { id: receipt.id },
      data: { quantityLeft: receipt.quantityLeft - consume },
    });

    if (receipt.price != null && receipt.priceCurrency != null && receipt.priceUnit != null) {
      if (currency !== null && currency !== receipt.priceCurrency) {
        mixedCurrencies = true;
      } else if (unit !== null && unit !== receipt.priceUnit) {
        mixedUnits = true;
      } else {
        currency = receipt.priceCurrency;
        unit = receipt.priceUnit;
        totalCost += receipt.price * consume;
        totalPricedQty += consume;
      }
    }
  }

  if (mixedCurrencies || mixedUnits || totalPricedQty === 0 || currency === null || unit === null) return null;

  return {
    costPrice: totalCost / totalPricedQty,
    costPriceCurrency: currency,
    costPriceUnit: unit,
  };
}
