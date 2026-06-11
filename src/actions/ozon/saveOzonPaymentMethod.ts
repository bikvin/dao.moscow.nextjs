"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { OzonFormState } from "./types";

// Saves the selected payment method ID as the Ozon marketplace payment method setting.
// This method is auto-assigned to all imported Ozon orders and hides the paid toggle in the UI.
export async function saveOzonPaymentMethod(
  _formState: OzonFormState,
  formData: FormData
): Promise<OzonFormState> {
  const value = formData.get("paymentMethodId")?.toString() ?? "";

  if (!value) return { errors: { _form: ["Выберите способ оплаты"] } };

  const exists = await db.paymentMethod.findUnique({ where: { id: value }, select: { id: true } });
  if (!exists) return { errors: { _form: ["Способ оплаты не найден"] } };

  try {
    await db.settings.upsert({
      where: { field: "ozonPaymentMethodId" },
      update: { value },
      create: { field: "ozonPaymentMethodId", value },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Сохранено" } };
}
