import { db } from "@/db";

type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Adds `quantity` units back to the most recently received receipt for a variant.
// Used when an issue is edited or deleted to reverse the FIFO consumption.
export async function restoreFifoStock(
  tx: TransactionClient,
  productVariantId: string,
  quantity: number
): Promise<void> {
  const lastReceipt = await tx.productReceipt.findFirst({
    where: { productVariantId },
    orderBy: { receiptDate: "desc" },
    select: { id: true, quantityLeft: true },
  });

  if (!lastReceipt) return;

  await tx.productReceipt.update({
    where: { id: lastReceipt.id },
    data: { quantityLeft: lastReceipt.quantityLeft + quantity },
  });
}
