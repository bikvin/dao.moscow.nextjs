"use server";

import { db } from "@/db";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { revalidatePath } from "next/cache";

export async function deleteVariant(
  _formState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const variantId = formData.get("id") as string;

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: {
      _count: {
        select: {
          productReceipts: true,
          productIssues: true,
          productReserves: true,
        },
      },
    },
  });

  if (!variant) {
    return { errors: { _form: ["Вариант не найден"] } };
  }

  const { productReceipts, productIssues, productReserves } = variant._count;

  if (productReceipts > 0 || productIssues > 0 || productReserves > 0) {
    return {
      errors: {
        _form: [
          "Невозможно удалить вариант с существующими поступлениями, выдачами или резервами",
        ],
      },
    };
  }

  await db.productVariant.delete({
    where: { id: variantId },
  });

  revalidatePath(`/admin/products/update/${variant.productId}`);

  return { success: { message: "Вариант удален" } };
}
