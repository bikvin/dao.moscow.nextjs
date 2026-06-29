"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductIssueFormState } from "./ProductIssueFormState";
import { createProductIssueSchema } from "@/zod/product/product-issue";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import { consumeFifoStock } from "@/lib/product/consumeFifoStock";

export async function createProductIssue(
  formState: ProductIssueFormState,
  formData: FormData
): Promise<ProductIssueFormState> {
  try {
    const costPriceRaw = formData.get("costPrice")?.toString();
    const result = createProductIssueSchema.safeParse({
      productVariantId: formData.get("productVariantId")?.toString(),
      quantity: formData.get("quantity")?.toString(),
      issueDate: formData.get("issueDate")?.toString(),
      type: formData.get("type")?.toString(),
      description: formData.get("description")?.toString(),
      costPrice: costPriceRaw || undefined,
      costPriceCurrency: formData.get("costPriceCurrency")?.toString() || undefined,
      costPriceUnit: formData.get("costPriceUnit")?.toString() || undefined,
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    const { costPrice, costPriceCurrency, costPriceUnit, ...issueData } = result.data;
    const hasManualCost = costPrice !== undefined && costPriceCurrency && costPriceUnit;

    await db.$transaction(async (tx) => {
      const fifoCost = hasManualCost ? null : await consumeFifoStock(tx, issueData.productVariantId, issueData.quantity);
      const cost = hasManualCost
        ? { costPrice, costPriceCurrency, costPriceUnit }
        : fifoCost;
      await tx.productIssue.create({
        data: { ...issueData, ...cost },
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

  revalidatePath("/admin/products/product-issues");

  redirect("/admin/products/product-issues");
}
