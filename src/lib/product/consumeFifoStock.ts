import { CurrencyEnum } from "@prisma/client";
import { db } from "@/db";

type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type FifoCost = {
  costPrice: number;
  costPriceCurrency: CurrencyEnum;
} | null;

// Consumes `quantity` units from the oldest available receipts (FIFO) for a given variant.
// Decrements quantityLeft on each receipt inside the transaction.
// Returns the weighted average unit cost if all consumed receipts share a single currency, otherwise null.
export async function consumeFifoStock(
  tx: TransactionClient,
  productVariantId: string,
  quantity: number
): Promise<FifoCost> {
  const receipts = await tx.productReceipt.findMany({
    where: { productVariantId, quantityLeft: { gt: 0 } },
    orderBy: { receiptDate: "asc" },
    select: { id: true, quantityLeft: true, price: true, priceCurrency: true },
  });

  let remaining = quantity;
  let totalCost = 0;
  let totalPricedQty = 0;
  let currency: CurrencyEnum | null = null;
  let mixedCurrencies = false;

  for (const receipt of receipts) {
    if (remaining <= 0) break;

    const consume = Math.min(receipt.quantityLeft, remaining);
    remaining -= consume;

    await tx.productReceipt.update({
      where: { id: receipt.id },
      data: { quantityLeft: receipt.quantityLeft - consume },
    });

    if (receipt.price != null && receipt.priceCurrency != null) {
      if (currency !== null && currency !== receipt.priceCurrency) {
        mixedCurrencies = true;
      } else {
        currency = receipt.priceCurrency;
        totalCost += receipt.price * consume;
        totalPricedQty += consume;
      }
    }
  }

  if (mixedCurrencies || totalPricedQty === 0 || currency === null) return null;

  return {
    costPrice: totalCost / totalPricedQty,
    costPriceCurrency: currency,
  };
}
