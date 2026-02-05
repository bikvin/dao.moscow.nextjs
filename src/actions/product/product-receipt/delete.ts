"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { revalidatePath } from "next/cache";

export async function deleteProductReceipt(
  _formState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return {
      errors: {
        _form: ["Что-то пошло не так. Id не найден или неверный."],
      },
    };
  }

  try {
    const productReceipt = await db.productReceipt.findUnique({
      where: { id: id },
    });

    if (!productReceipt) throw new Error("Приход не найден");

    await db.$transaction(async (tx) => {
      await tx.productReceipt.delete({
        where: { id: id },
      });

      await recalculateWarehouseQuantity(productReceipt.productVariantId, tx);
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Something went wrong"],
      },
    };
  }

  revalidatePath("/admin/products/product-receipts");

  return { success: { message: "Удалено успешно" } };
}
