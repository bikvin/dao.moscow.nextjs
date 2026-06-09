"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import type { BufferFormState } from "@/actions/yandex/types";

// Saves the selected delivery method ID as the self-pickup method setting.
// When an order uses this method, the shipment badge shows "Самовывоз" instead of "Доставка".
export async function savePickupDeliveryMethod(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const value = formData.get("deliveryMethodId")?.toString() ?? "";

  if (!value) {
    return { errors: { _form: ["Выберите способ доставки"] } };
  }

  const exists = await db.deliveryMethod.findUnique({ where: { id: value }, select: { id: true } });
  if (!exists) {
    return { errors: { _form: ["Способ доставки не найден"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "selfPickupDeliveryMethodId" },
      update: { value },
      create: { field: "selfPickupDeliveryMethodId", value },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/orders/delivery-methods");
  return { success: { message: "Сохранено" } };
}
