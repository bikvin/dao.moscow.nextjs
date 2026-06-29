"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export interface TaxSettingsFormState {
  errors?: { taxRate?: string[]; commissionRate?: string[]; _form?: string[] };
  success?: { message: string };
}

// Saves tax rate, taxable payment method IDs, merchant commission rate, and commission payment method IDs.
export async function saveTaxSettings(
  _formState: TaxSettingsFormState,
  formData: FormData,
): Promise<TaxSettingsFormState> {
  const taxRaw = formData.get("taxRate")?.toString() ?? "";
  const taxRate = parseFloat(taxRaw);
  if (taxRaw === "" || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    return { errors: { taxRate: ["Укажите ставку от 0 до 100"] } };
  }

  const commissionRaw = formData.get("commissionRate")?.toString() ?? "";
  const commissionRate = parseFloat(commissionRaw);
  if (commissionRaw === "" || isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return { errors: { commissionRate: ["Укажите ставку от 0 до 100"] } };
  }

  const taxableIds = formData.getAll("taxablePaymentMethodIds").map(String);
  const commissionIds = formData.getAll("commissionPaymentMethodIds").map(String);

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
      db.settings.upsert({
        where: { field: "commissionRate" },
        update: { value: commissionRate.toString() },
        create: { field: "commissionRate", value: commissionRate.toString() },
      }),
      db.settings.upsert({
        where: { field: "commissionPaymentMethodIds" },
        update: { value: JSON.stringify(commissionIds) },
        create: { field: "commissionPaymentMethodIds", value: JSON.stringify(commissionIds) },
      }),
    ]);
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/tax/settings");
  return { success: { message: "Сохранено" } };
}
