import { db } from "@/db";

// Type for transaction client - omits transaction-specific methods
type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Recalculates and updates the warehouse quantity for a product variant
 * by summing all receipt quantities for that variant.
 *
 * @param variantId - The ID of the product variant to recalculate
 * @param prisma - Optional Prisma client or transaction client (defaults to db)
 * @returns The updated warehouse quantity
 */
export async function recalculateWarehouseQuantity(
  variantId: string,
  prisma: TransactionClient = db
): Promise<number> {
  const total = await prisma.productReceipt.aggregate({
    where: { productVariantId: variantId },
    _sum: { quantity: true },
  });

  const newQuantity = total._sum.quantity || 0;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { warehouseQuantity: newQuantity },
  });

  return newQuantity;
}
