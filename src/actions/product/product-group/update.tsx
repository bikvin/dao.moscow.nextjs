"use server";

import { db } from "@/db";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { editProductGroupSchema } from "@/zod/product/product-group";

interface UpdateProductGroupFormState {
  errors: {
    id?: string[];
    name?: string[];
    displayOrder?: string[];
    _form?: string[];
  };
}

export async function updateProductGroup(
  formState: UpdateProductGroupFormState,
  formData: FormData
): Promise<UpdateProductGroupFormState> {
  const result = editProductGroupSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    displayOrder: formData.get("displayOrder"),
  });

  if (!result.success) {
    // console.log(result.error.flatten().fieldErrors);

    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await db.productGroup.update({
      where: {
        id: result.data.id,
      },
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
        errors: {
          _form: ["Something went wrong"],
        },
      };
    }
  }

  revalidatePath("/admin/products/product-groups");

  redirect("/admin/products/product-groups");
}
