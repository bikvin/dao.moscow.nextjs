"use server";

import { db } from "@/db";
import { createProductGroupSchema } from "@/zod/product/product-group";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface CreateProductGroupFormState {
  errors: {
    name?: string[];
    displayOrder?: string[];
    _form?: string[];
  };
}

export async function createProductGroup(
  formState: CreateProductGroupFormState,
  formData: FormData
): Promise<CreateProductGroupFormState> {
  try {
    const result = createProductGroupSchema.safeParse({
      name: formData.get("name"),
      displayOrder: formData.get("displayOrder"),
    });

    if (!result.success) {
      console.log(result.error.flatten().fieldErrors);

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
