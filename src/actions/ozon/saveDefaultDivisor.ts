"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { BufferFormState } from "@/actions/yandex/saveDefaultBuffer";

export async function saveOzonDefaultDivisor(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("divisor");
  const value = parseInt(raw?.toString() ?? "1", 10);

  if (isNaN(value) || value < 1) {
    return { errors: { _form: ["Укажите корректное число ≥ 1"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "ozonDefaultDivisor" },
      update: { value: String(value) },
      create: { field: "ozonDefaultDivisor", value: String(value) },
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
