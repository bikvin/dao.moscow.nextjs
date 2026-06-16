"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { OzonFormState } from "./types";

// Saves the estimated average Ozon reverse logistics fee per returned unit (₽/шт).
// Used to estimate the extra cost of a return before transaction fees settle.
export async function saveOzonAverageReturnLogisticFee(
  _formState: OzonFormState,
  formData: FormData
): Promise<OzonFormState> {
  const raw = formData.get("averageReturnLogisticFee")?.toString() ?? "";
  const value = parseFloat(raw);

  if (isNaN(value) || value < 0) {
    return { errors: { _form: ["Введите корректное значение (₽, ≥ 0)"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "ozonAverageReturnLogisticFeeRub" },
      update: { value: String(value) },
      create: { field: "ozonAverageReturnLogisticFeeRub", value: String(value) },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Сохранено" } };
}
