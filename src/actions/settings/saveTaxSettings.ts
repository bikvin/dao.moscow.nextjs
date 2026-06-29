"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export interface TaxSettingsFormState {
  errors?: { taxRate?: string[]; _form?: string[] };
  success?: { message: string };
}

// Saves the tax rate (%) and the list of taxable payment method IDs.
export async function saveTaxSettings(
  _formState: TaxSettingsFormState,
  formData: FormData,
): Promise<TaxSettingsFormState> {
  const raw = formData.get("taxRate")?.toString() ?? "";
  const taxRate = parseFloat(raw);

  if (raw === "" || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    return { errors: { taxRate: ["Укажите ставку от 0 до 100"] } };
  }

  const taxableIds = formData.getAll("taxablePaymentMethodIds").map(String);

  try {
    await Promise.all([
      db.settings.upsert({
        where: { field: "taxRate" },
        update: { value: taxRate.toString() },
        create: { field: "taxRate", value: taxRate.toString() },
      }),
      db.settings.upsert({
        where: { field: "taxablePaymentMethodIds" },
        update: { value: JSON.stringify(taxableIds) },
        create: { field: "taxablePaymentMethodIds", value: JSON.stringify(taxableIds) },
      }),
    ]);
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/tax/settings");
  return { success: { message: "Сохранено" } };
}
