import { db } from "@/db";

// Type for transaction client - omits transaction-specific methods
type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Recalculates and updates both warehouse and available quantities for a product variant.
 * - warehouseQuantity = receipts - issues (physical stock)
 * - availableQuantity = warehouseQuantity - active reserves (available for sale)
 *
 * @param variantId - The ID of the product variant to recalculate
 * @param prisma - Optional Prisma client or transaction client (defaults to db)
 * @returns Object with updated warehouseQuantity and availableQuantity
 */
export async function recalculateWarehouseQuantity(
  variantId: string,
  prisma: TransactionClient = db
): Promise<{ warehouseQuantity: number; availableQuantity: number }> {
  // Sum all receipts (incoming stock)
  const receiptsTotal = await prisma.productReceipt.aggregate({
    where: { productVariantId: variantId },
    _sum: { quantity: true },
  });

  // Sum all issues (outgoing stock)
  const issuesTotal = await prisma.productIssue.aggregate({
    where: { productVariantId: variantId },
    _sum: { quantity: true },
  });

  // Sum all active reserves (reserved stock)
  const reservesTotal = await prisma.productReserve.aggregate({
    where: {
      productVariantId: variantId,
      status: "ACTIVE",
    },
    _sum: { quantity: true },
  });

  const receipts = receiptsTotal._sum.quantity || 0;
  const issues = issuesTotal._sum.quantity || 0;
  const reserves = reservesTotal._sum.quantity || 0;

  const warehouseQuantity = receipts - issues;
  const availableQuantity = warehouseQuantity - reserves;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      warehouseQuantity,
      availableQuantity,
    },
  });

  return { warehouseQuantity, availableQuantity };
}
