import { CurrencyEnum, PriceUnitEnum } from "@prisma/client";
import { db } from "@/db";

type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type ReceiptPrice = {
  price: number;
  priceCurrency: CurrencyEnum;
  priceUnit: PriceUnitEnum;
} | null;

// Infers the cost price for a return receipt from existing purchase receipts.
// Prefers the newest receipt that has been partially consumed (quantityLeft < quantity),
// falling back to the oldest receipt with a positive price.
export async function inferReturnReceiptPrice(
  tx: TransactionClient,
  productVariantId: string,
  excludeReceiptId?: string,
): Promise<ReceiptPrice> {
  const receipts = await tx.productReceipt.findMany({
    where: {
      productVariantId,
      price: { gt: 0 },
      ...(excludeReceiptId ? { id: { not: excludeReceiptId } } : {}),
    },
    orderBy: [{ receiptDate: "desc" }, { createdAt: "desc" }],
    select: { price: true, priceCurrency: true, priceUnit: true, quantity: true, quantityLeft: true },
  });

  const touched = receipts.find((r) => r.quantityLeft < r.quantity);
  const source = touched ?? receipts[receipts.length - 1];

  if (source?.price != null && source.priceCurrency != null && source.priceUnit != null) {
    return { price: source.price, priceCurrency: source.priceCurrency, priceUnit: source.priceUnit };
  }

  return null;
}
