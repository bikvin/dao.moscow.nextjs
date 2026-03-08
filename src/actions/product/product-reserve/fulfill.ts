"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { ProductIssueEnum, ProductReserveStatusEnum } from "@prisma/client";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { revalidatePath } from "next/cache";

export async function fulfillProductReserve(
  _formState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return { errors: { _form: ["Что-то пошло не так. Id не найден или неверный."] } };
  }

  try {
    await db.$transaction(async (tx) => {
      const reserve = await tx.productReserve.findUnique({ where: { id } });

      if (!reserve) throw new Error("Резерв не найден");
      if (reserve.status !== ProductReserveStatusEnum.ACTIVE) {
        throw new Error("Резерв уже не активен");
      }

      await tx.productReserve.update({
        where: { id },
        data: { status: ProductReserveStatusEnum.FULFILLED },
      });

      await tx.productIssue.create({
        data: {
          productVariantId: reserve.productVariantId,
          quantity: reserve.quantity,
          issueDate: new Date(),
          type: ProductIssueEnum.SALE,
          description: `Продажа по резерву (клиент: ${reserve.client}, дата резерва: ${reserve.reserveDate.toLocaleDateString("ru-RU")})`,
        },
      });

      await recalculateWarehouseQuantity(reserve.productVariantId, tx);
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/products/product-reserves");
  revalidatePath("/admin/products/product-issues");
  revalidatePath("/admin/warehouse");

  return { success: { message: "Выполнено" } };
}
