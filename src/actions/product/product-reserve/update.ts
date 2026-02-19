"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductReserveFormState } from "./ProductReserveFormState";
import { updateProductReserveSchema } from "@/zod/product/product-reserve";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";

export async function updateProductReserve(
  _formState: ProductReserveFormState,
  formData: FormData
): Promise<ProductReserveFormState> {
  try {
    const result = updateProductReserveSchema.safeParse({
      id: formData.get("id")?.toString(),
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
      // Fetch the old reserve to get the previous variantId and status
      const oldReserve = await tx.productReserve.findUnique({
        where: { id: result.data.id },
      });

      // Update the reserve
      await tx.productReserve.update({
        where: { id: result.data.id },
        data: result.data,
      });

      // Recalculate the new variant
      await recalculateWarehouseQuantity(result.data.productVariantId, tx);

      // If variant changed, also recalculate the old one
      if (
        oldReserve &&
        oldReserve.productVariantId !== result.data.productVariantId
      ) {
        await recalculateWarehouseQuantity(oldReserve.productVariantId, tx);
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

  revalidatePath("/admin/products/product-reserves");

  redirect("/admin/products/product-reserves");
}
