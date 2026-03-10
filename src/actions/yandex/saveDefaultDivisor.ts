"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { BufferFormState } from "./saveDefaultBuffer";

export async function saveDefaultDivisor(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("divisor");
  const value = parseInt(raw?.toString() ?? "3", 10);

  if (isNaN(value) || value < 1) {
    return { errors: { _form: ["Укажите корректное число ≥ 1"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "yandexDefaultDivisor" },
      update: { value: String(value) },
      create: { field: "yandexDefaultDivisor", value: String(value) },
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/yandex");
  return { success: { message: "Сохранено" } };
}
