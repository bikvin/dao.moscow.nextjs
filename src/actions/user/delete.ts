"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function deleteUser(
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
    const article = await db.user.findUnique({ where: { id: id } });

    if (!article) throw new Error("User not found");

    await db.user.delete({
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

  revalidatePath("/admin/users/all-users");

  return { success: { message: "Удалено успешно" } };
}
