"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductIssueFormState } from "./ProductIssueFormState";
import { createProductIssueSchema } from "@/zod/product/product-issue";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";

export async function createProductIssue(
  formState: ProductIssueFormState,
  formData: FormData
): Promise<ProductIssueFormState> {
  try {
    const result = createProductIssueSchema.safeParse({
      productVariantId: formData.get("productVariantId")?.toString(),
      quantity: formData.get("quantity")?.toString(),
      issueDate: formData.get("issueDate")?.toString(),
      type: formData.get("type")?.toString(),
      description: formData.get("description")?.toString(),
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    await db.$transaction(async (tx) => {
      await tx.productIssue.create({
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

  revalidatePath("/admin/products/product-issues");

  redirect("/admin/products/product-issues");
}
