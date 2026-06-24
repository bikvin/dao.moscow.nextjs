import { db } from "@/db";

type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Restores `quantity` units to the correct receipt when an issue is deleted or edited.
// Receipts are evaluated newest-to-oldest. The target is the newest receipt that has
// been consumed (quantityLeft < quantity) — i.e. the first non-full receipt from the top.
// Falls back to the newest receipt if all receipts are currently at full stock.
export async function restoreFifoStock(
  tx: TransactionClient,
  productVariantId: string,
  quantity: number
): Promise<void> {
  const receipts = await tx.productReceipt.findMany({
    where: { productVariantId },
    orderBy: [{ receiptDate: "desc" }, { createdAt: "desc" }],
    select: { id: true, quantity: true, quantityLeft: true },
  });

  if (receipts.length === 0) return;

  const target = receipts.find((r) => r.quantityLeft < r.quantity) ?? receipts[0];

  await tx.productReceipt.update({
    where: { id: target.id },
    data: { quantityLeft: target.quantityLeft + quantity },
  });
}
