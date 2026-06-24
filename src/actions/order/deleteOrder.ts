"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { restoreFifoStock } from "@/lib/product/restoreFifoStock";

// Deletes an order and cleans up all linked stock movements.
// ProductReserve and ProductIssue use onDelete: SetNull so they are NOT auto-deleted —
// we must delete them manually and recalculate warehouse quantities for each affected variant.
// OrderItem and YandexOrderData cascade automatically.
export async function deleteOrder(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (!id || typeof id !== "string") throw new Error("Id не найден или неверный");

  await db.$transaction(async (tx) => {
    // Collect all variant IDs that need quantity recalculation
    const [reserves, issues] = await Promise.all([
      tx.productReserve.findMany({
        where: { orderId: id },
        select: { id: true, productVariantId: true },
      }),
      tx.productIssue.findMany({
        where: { orderId: id },
        select: { id: true, productVariantId: true, quantity: true },
      }),
    ]);

    const affectedVariantIds = new Set([
      ...reserves.map((r) => r.productVariantId),
      ...issues.map((i) => i.productVariantId),
    ]);

    // Restore FIFO stock for each issue before deleting
    for (const issue of issues) {
      await restoreFifoStock(tx, issue.productVariantId, issue.quantity);
    }

    // Delete reserves and issues linked to this order
    await tx.productReserve.deleteMany({ where: { orderId: id } });
    await tx.productIssue.deleteMany({ where: { orderId: id } });

    // Delete the order (cascades to OrderItem and YandexOrderData)
    await tx.order.delete({ where: { id } });

    // Recalculate warehouse quantities for all affected variants
    for (const variantId of affectedVariantIds) {
      await recalculateWarehouseQuantity(variantId, tx);
    }
  });

  revalidatePath("/admin");
}
