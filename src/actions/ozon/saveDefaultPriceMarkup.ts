"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { BufferFormState } from "@/actions/yandex/saveDefaultBuffer";

export async function saveOzonDefaultPriceMarkup(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("priceMarkup");
  const value = parseInt(raw?.toString() ?? "0", 10);

  if (isNaN(value)) {
    return { errors: { _form: ["Укажите корректное целое число"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "ozonDefaultPriceMarkup" },
      update: { value: String(value) },
      create: { field: "ozonDefaultPriceMarkup", value: String(value) },
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
