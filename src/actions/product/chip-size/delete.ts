"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function deleteChipSize(
  _formState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return { errors: { _form: ["Что-то пошло не так. Id не найден или неверный."] } };
  }

  try {
    await db.chipSize.delete({ where: { id } });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/products/chip-sizes");
  return { success: { message: "Удалено успешно" } };
}
