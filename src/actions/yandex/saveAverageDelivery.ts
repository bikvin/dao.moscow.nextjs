"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { BufferFormState } from "./saveDefaultBuffer";

export async function saveAverageDelivery(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("averageDelivery");
  const value = parseInt(raw?.toString() ?? "0", 10);

  if (isNaN(value) || value < 0) {
    return { errors: { _form: ["Укажите целое неотрицательное число"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "yandexAverageDeliveryRub" },
      update: { value: String(value) },
      create: { field: "yandexAverageDeliveryRub", value: String(value) },
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
