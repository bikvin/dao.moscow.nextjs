"use server";

import { db } from "@/db";
import { createProductGroupSchema } from "@/zod/product/product-group";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductGroupFormState } from "./ProductGroupFormState";

export async function createProductGroup(
  formState: ProductGroupFormState,
  formData: FormData
): Promise<ProductGroupFormState> {
  try {
    const result = createProductGroupSchema.safeParse({
      name: formData.get("name"),
      displayOrder: formData.get("displayOrder"),
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    await db.productGroup.create({
      data: {
        name: result.data.name,
        displayOrder: Number(result.data.displayOrder),
      },
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

  revalidatePath("/admin/products/product-groups");

  redirect("/admin/products/product-groups");
}
