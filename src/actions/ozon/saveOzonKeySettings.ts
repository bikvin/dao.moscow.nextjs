"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

type FormState = { success?: string; error?: string };

// Saves the Ozon API key renewal date and validity period to Settings.
export async function saveOzonKeySettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const renewDate = formData.get("ozonKeyRenewDate")?.toString();
  const periodDays = parseInt(formData.get("ozonKeyPeriodDays")?.toString() ?? "", 10);

  if (!renewDate) return { error: "Укажите дату обновления ключа" };
  if (isNaN(periodDays) || periodDays < 1) return { error: "Укажите корректный срок действия" };

  try {
    await Promise.all([
      db.settings.upsert({
        where: { field: "ozonKeyRenewDate" },
        update: { value: renewDate },
        create: { field: "ozonKeyRenewDate", value: renewDate },
      }),
      db.settings.upsert({
        where: { field: "ozonKeyPeriodDays" },
        update: { value: String(periodDays) },
        create: { field: "ozonKeyPeriodDays", value: String(periodDays) },
      }),
    ]);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Что-то пошло не так" };
  }

  revalidatePath("/admin/ozon");
  revalidatePath("/admin/warehouse");
  return { success: "Сохранено" };
}
