"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { BufferFormState } from "./saveDefaultBuffer";

export async function saveCommissionRate(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("commissionRate");
  const value = parseInt(raw?.toString() ?? "0", 10);

  if (isNaN(value) || value < 0 || value > 100) {
    return { errors: { _form: ["Укажите целое число от 0 до 100"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "yandexCommissionRate" },
      update: { value: String(value) },
      create: { field: "yandexCommissionRate", value: String(value) },
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
