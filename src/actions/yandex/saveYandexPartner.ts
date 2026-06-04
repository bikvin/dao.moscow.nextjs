"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { BufferFormState } from "./types";

export async function saveYandexPartner(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const value = formData.get("partnerId")?.toString() ?? "";

  if (!value) {
    return { errors: { _form: ["Выберите партнёра"] } };
  }

  const exists = await db.partner.findUnique({ where: { id: value }, select: { id: true } });
  if (!exists) {
    return { errors: { _form: ["Партнёр не найден"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "yandexPartnerId" },
      update: { value },
      create: { field: "yandexPartnerId", value },
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
