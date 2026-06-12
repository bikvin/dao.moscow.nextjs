"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { OzonFormState } from "./types";

// Saves the estimated average Ozon commission rate (% of buyer price).
// Used to estimate payout on import for orders whose financial_data is not yet populated.
export async function saveOzonAverageCommissionPercent(
  _formState: OzonFormState,
  formData: FormData
): Promise<OzonFormState> {
  const raw = formData.get("averageCommissionPercent")?.toString() ?? "";
  const value = parseFloat(raw);

  if (isNaN(value) || value < 0 || value > 100) {
    return { errors: { _form: ["Введите корректное значение (%, от 0 до 100)"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "ozonAverageCommissionPercent" },
      update: { value: String(value) },
      create: { field: "ozonAverageCommissionPercent", value: String(value) },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Сохранено" } };
}
