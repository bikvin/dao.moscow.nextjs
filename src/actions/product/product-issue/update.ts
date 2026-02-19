"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductIssueFormState } from "./ProductIssueFormState";
import { updateProductIssueSchema } from "@/zod/product/product-issue";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";

export async function updateProductIssue(
  _formState: ProductIssueFormState,
  formData: FormData
): Promise<ProductIssueFormState> {
  try {
    const result = updateProductIssueSchema.safeParse({
      id: formData.get("id")?.toString(),
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
      // Fetch the old issue to get the previous variantId
      const oldIssue = await tx.productIssue.findUnique({
        where: { id: result.data.id },
      });

      // Update the issue
      await tx.productIssue.update({
        where: { id: result.data.id },
        data: result.data,
      });

      // Recalculate the new variant
      await recalculateWarehouseQuantity(result.data.productVariantId, tx);

      // If variant changed, also recalculate the old one
      if (
        oldIssue &&
        oldIssue.productVariantId !== result.data.productVariantId
      ) {
        await recalculateWarehouseQuantity(oldIssue.productVariantId, tx);
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

  revalidatePath("/admin/products/product-issues");

  redirect("/admin/products/product-issues");
}
