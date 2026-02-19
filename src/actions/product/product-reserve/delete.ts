"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { revalidatePath } from "next/cache";

export async function deleteProductReserve(
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
    const productReserve = await db.productReserve.findUnique({
      where: { id: id },
    });

    if (!productReserve) throw new Error("Резерв не найден");

    await db.$transaction(async (tx) => {
      await tx.productReserve.delete({
        where: { id: id },
      });

      await recalculateWarehouseQuantity(productReserve.productVariantId, tx);
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Something went wrong"],
      },
    };
  }

  revalidatePath("/admin/products/product-reserves");

  return { success: { message: "Удалено успешно" } };
}
