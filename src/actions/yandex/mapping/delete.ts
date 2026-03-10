"use server";

import { db } from "@/db";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { revalidatePath } from "next/cache";

export async function deleteYandexMapping(
  _formState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return { errors: { _form: ["Id не найден"] } };
  }

  try {
    await db.yandexMarketMapping.delete({ where: { id } });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/yandex/mappings");
  return { success: { message: "Удалено" } };
}
