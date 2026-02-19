"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { revalidatePath } from "next/cache";

export async function deleteProductIssue(
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
    const productIssue = await db.productIssue.findUnique({
      where: { id: id },
    });

    if (!productIssue) throw new Error("Списание не найдено");

    await db.$transaction(async (tx) => {
      await tx.productIssue.delete({
        where: { id: id },
      });

      await recalculateWarehouseQuantity(productIssue.productVariantId, tx);
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Something went wrong"],
      },
    };
  }

  revalidatePath("/admin/products/product-issues");

  return { success: { message: "Удалено успешно" } };
}
