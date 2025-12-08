"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function deleteProductGroup(
  _formState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return {
      errors: {
        _form: ["Что-то пошло не так. Id не найден или неверный."],
      },
    };
  }

  try {
    const productGroup = await db.productGroup.findUnique({
      where: { id: id },
    });

    if (!productGroup) throw new Error("Group not found");

    await db.productGroup.delete({
      where: {
        id: id,
      },
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Something went wrong"],
      },
    };
  }

  revalidatePath("/admin/products/product-groups");

  return { success: { message: "Удалено успешно" } };
}
