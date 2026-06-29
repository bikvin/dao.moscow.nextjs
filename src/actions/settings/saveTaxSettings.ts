"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export interface TaxSettingsFormState {
  errors?: { taxRate?: string[]; _form?: string[] };
  success?: { message: string };
}

// Saves the tax rate (%) applied to taxable-payment-method orders when computing margin.
export async function saveTaxSettings(
  _formState: TaxSettingsFormState,
  formData: FormData,
): Promise<TaxSettingsFormState> {
  const raw = formData.get("taxRate")?.toString() ?? "";
  const taxRate = parseFloat(raw);

  if (raw === "" || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    return { errors: { taxRate: ["Укажите ставку от 0 до 100"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "taxRate" },
      update: { value: taxRate.toString() },
      create: { field: "taxRate", value: taxRate.toString() },
    });
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/settings");
  return { success: { message: "Сохранено" } };
}
