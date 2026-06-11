"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { OzonFormState } from "./types";

// Saves the selected partner ID as the Ozon marketplace partner setting.
// This partner is auto-assigned to all imported Ozon orders.
export async function saveOzonPartner(
  _formState: OzonFormState,
  formData: FormData
): Promise<OzonFormState> {
  const value = formData.get("partnerId")?.toString() ?? "";

  if (!value) return { errors: { _form: ["Выберите партнёра"] } };

  const exists = await db.partner.findUnique({ where: { id: value }, select: { id: true } });
  if (!exists) return { errors: { _form: ["Партнёр не найден"] } };

  try {
    await db.settings.upsert({
      where: { field: "ozonPartnerId" },
      update: { value },
      create: { field: "ozonPartnerId", value },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Сохранено" } };
}
