"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { BufferFormState } from "./types";

// Saves the selected payment method ID as the Yandex marketplace payment method setting.
// This method is auto-assigned to all imported Yandex orders and hides the paid toggle in the UI.
export async function saveYandexPaymentMethod(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const value = formData.get("paymentMethodId")?.toString() ?? "";

  if (!value) {
    return { errors: { _form: ["Выберите способ оплаты"] } };
  }

  const exists = await db.paymentMethod.findUnique({ where: { id: value }, select: { id: true } });
  if (!exists) {
    return { errors: { _form: ["Способ оплаты не найден"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "yandexPaymentMethodId" },
      update: { value },
      create: { field: "yandexPaymentMethodId", value },
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
