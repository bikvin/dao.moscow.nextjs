"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductReceiptFormState } from "./ProductReceiptFormState";
import { Prisma } from "@prisma/client";
import { updateProductReceiptSchema } from "@/zod/product/product-receipt";

export async function updateProductReceipt(
  formState: ProductReceiptFormState,
  formData: FormData
): Promise<ProductReceiptFormState> {
  try {
    const result = updateProductReceiptSchema.safeParse({
      id: formData.get("id")?.toString(),
      productId: formData.get("productId")?.toString(),
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

    await db.productReceipt.update({
      where: {
        id: result.data.id,
      },
      data: result.data,
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
