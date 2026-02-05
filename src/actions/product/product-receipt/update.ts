"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductReceiptFormState } from "./ProductReceiptFormState";
import { updateProductReceiptSchema } from "@/zod/product/product-receipt";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";

export async function updateProductReceipt(
  _formState: ProductReceiptFormState,
  formData: FormData
): Promise<ProductReceiptFormState> {
  try {
    const result = updateProductReceiptSchema.safeParse({
      id: formData.get("id")?.toString(),
      productVariantId: formData.get("productVariantId")?.toString(),
      quantity: formData.get("quantity")?.toString(),
      receiptDate: formData.get("receiptDate")?.toString(),
      type: formData.get("type")?.toString(),
      description: formData.get("description")?.toString(),
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    await db.$transaction(async (tx) => {
      // Fetch the old receipt to get the previous variantId
      const oldReceipt = await tx.productReceipt.findUnique({
        where: { id: result.data.id },
      });

      // Update the receipt
      await tx.productReceipt.update({
        where: { id: result.data.id },
        data: result.data,
      });

      // Recalculate the new variant
      await recalculateWarehouseQuantity(result.data.productVariantId, tx);

      // If variant changed, also recalculate the old one
      if (
        oldReceipt &&
        oldReceipt.productVariantId !== result.data.productVariantId
      ) {
        await recalculateWarehouseQuantity(oldReceipt.productVariantId, tx);
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

  revalidatePath("/admin/products/product-receipts");

  redirect("/admin/products/product-receipts");
}
