"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductReserveFormState } from "./ProductReserveFormState";
import { createProductReserveSchema } from "@/zod/product/product-reserve";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";

export async function createProductReserve(
  formState: ProductReserveFormState,
  formData: FormData
): Promise<ProductReserveFormState> {
  try {
    const result = createProductReserveSchema.safeParse({
      productVariantId: formData.get("productVariantId")?.toString(),
      quantity: formData.get("quantity")?.toString(),
      reserveDate: formData.get("reserveDate")?.toString(),
      client: formData.get("client")?.toString(),
      status: formData.get("status")?.toString(),
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    await db.$transaction(async (tx) => {
      await tx.productReserve.create({
        data: result.data,
      });

      await recalculateWarehouseQuantity(result.data.productVariantId, tx);
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

  revalidatePath("/admin/products/product-reserves");

  redirect("/admin/products/product-reserves");
}
