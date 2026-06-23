"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductIssueFormState } from "./ProductIssueFormState";
import { updateProductIssueSchema } from "@/zod/product/product-issue";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { consumeFifoStock } from "@/lib/product/consumeFifoStock";
import { restoreFifoStock } from "@/lib/product/restoreFifoStock";

export async function updateProductIssue(
  _formState: ProductIssueFormState,
  formData: FormData
): Promise<ProductIssueFormState> {
  try {
    const result = updateProductIssueSchema.safeParse({
      id: formData.get("id")?.toString(),
      productVariantId: formData.get("productVariantId")?.toString(),
      quantity: formData.get("quantity")?.toString(),
      issueDate: formData.get("issueDate")?.toString(),
      type: formData.get("type")?.toString(),
      description: formData.get("description")?.toString(),
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    await db.$transaction(async (tx) => {
      const oldIssue = await tx.productIssue.findUnique({
        where: { id: result.data.id },
      });

      // Restore stock consumed by the old issue
      if (oldIssue) {
        await restoreFifoStock(tx, oldIssue.productVariantId, oldIssue.quantity);
      }

      // Consume stock for the new issue values and recalculate cost
      const cost = await consumeFifoStock(tx, result.data.productVariantId, result.data.quantity);

      await tx.productIssue.update({
        where: { id: result.data.id },
        data: { ...result.data, ...cost },
      });

      await recalculateWarehouseQuantity(result.data.productVariantId, tx);

      if (oldIssue && oldIssue.productVariantId !== result.data.productVariantId) {
        await recalculateWarehouseQuantity(oldIssue.productVariantId, tx);
      }
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      };
    } else {
      return {
        errors: { _form: ["Что-то пошло не так"] },
      };
    }
  }

  revalidatePath("/admin/products/product-issues");

  redirect("/admin/products/product-issues");
}
