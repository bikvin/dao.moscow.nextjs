"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { OzonFormState } from "./types";

// Saves the estimated average Ozon service fee per posting (₽).
// Used to estimate net price on import before transaction fees are settled.
export async function saveOzonAverageServiceFee(
  _formState: OzonFormState,
  formData: FormData
): Promise<OzonFormState> {
  const raw = formData.get("averageServiceFee")?.toString() ?? "";
  const value = parseFloat(raw);

  if (isNaN(value) || value < 0) {
    return { errors: { _form: ["Введите корректное значение (₽, ≥ 0)"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "ozonAverageServiceFeeRub" },
      update: { value: String(value) },
      create: { field: "ozonAverageServiceFeeRub", value: String(value) },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Сохранено" } };
}
