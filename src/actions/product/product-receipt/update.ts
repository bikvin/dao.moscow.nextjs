"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductReceiptFormState } from "./ProductReceiptFormState";
import { updateProductReceiptSchema } from "@/zod/product/product-receipt";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { inferReturnReceiptPrice } from "@/lib/product/inferReturnReceiptPrice";
import { ProductReceiptTypeEnum } from "@prisma/client";

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

      // For return receipts with no price entered, infer cost from existing purchase receipts.
      let resolvedPrice: number | null = null;
      let resolvedCurrency: typeof priceCurrency | null = null;
      let resolvedUnit: typeof priceUnit | null = null;
      if (hasCost) {
        resolvedPrice = price as number;
        resolvedCurrency = priceCurrency!;
        resolvedUnit = priceUnit!;
      } else if (rest.type === ProductReceiptTypeEnum.RETURN) {
        const inferred = await inferReturnReceiptPrice(tx, rest.productVariantId, rest.id);
        if (inferred) {
          resolvedPrice = inferred.price;
          resolvedCurrency = inferred.priceCurrency;
          resolvedUnit = inferred.priceUnit;
        }
      }

      await tx.productReceipt.update({
        where: { id: rest.id },
        data: {
          ...rest,
          price: resolvedPrice,
          priceCurrency: resolvedCurrency,
          priceUnit: resolvedUnit,
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
