"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { BufferFormState } from "@/actions/yandex/saveDefaultBuffer";

export async function saveOzonDefaultCrossedPriceMarkup(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("crossedPriceMarkup");
  const value = parseInt(raw?.toString() ?? "0", 10);

  if (isNaN(value) || value < 0) {
    return { errors: { _form: ["Укажите корректное число ≥ 0"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "ozonCrossedPriceMarkup" },
      update: { value: String(value) },
      create: { field: "ozonCrossedPriceMarkup", value: String(value) },
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Сохранено" } };
}
