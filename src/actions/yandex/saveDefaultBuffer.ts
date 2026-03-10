"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export interface BufferFormState {
  errors?: { _form?: string[] };
  success?: { message: string };
}

export async function saveDefaultBuffer(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("buffer");
  const value = parseInt(raw?.toString() ?? "0", 10);

  if (isNaN(value) || value < 0) {
    return { errors: { _form: ["Укажите корректное число ≥ 0"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "yandexDefaultBuffer" },
      update: { value: String(value) },
      create: { field: "yandexDefaultBuffer", value: String(value) },
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
