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
    const priceRaw = formData.get("price")?.toString();
    const result = updateProductReceiptSchema.safeParse({
      id: formData.get("id")?.toString(),
      productVariantId: formData.get("productVariantId")?.toString(),
      quantity: formData.get("quantity")?.toString(),
      receiptDate: formData.get("receiptDate")?.toString(),
      type: formData.get("type")?.toString(),
      description: formData.get("description")?.toString(),
      price: priceRaw || undefined,
      priceCurrency: formData.get("priceCurrency")?.toString() || undefined,
      priceUnit: formData.get("priceUnit")?.toString() || undefined,
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    const { price, priceCurrency, priceUnit, ...rest } = result.data;
    const hasCost = price !== undefined && price !== "" && priceCurrency && priceUnit;

    await db.$transaction(async (tx) => {
      const oldReceipt = await tx.productReceipt.findUnique({
        where: { id: rest.id },
      });

      await tx.productReceipt.update({
        where: { id: rest.id },
        data: {
          ...rest,
          price: hasCost ? (price as number) : null,
          priceCurrency: hasCost ? priceCurrency : null,
          priceUnit: hasCost ? priceUnit : null,
        },
      });

      await recalculateWarehouseQuantity(rest.productVariantId, tx);

      if (oldReceipt && oldReceipt.productVariantId !== rest.productVariantId) {
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
