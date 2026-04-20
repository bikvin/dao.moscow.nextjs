"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { z } from "zod";

const paymentMethodSchema = z.object({
  name: z.string().min(1, "Введите название"),
});

export async function createPaymentMethod(
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = paymentMethodSchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.paymentMethod.create({ data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/orders/payment-methods");
  return { success: { message: "Добавлено" } };
}

export async function updatePaymentMethod(
  id: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = paymentMethodSchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.paymentMethod.update({ where: { id }, data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/orders/payment-methods");
  return { success: { message: "Сохранено" } };
}

export async function deletePaymentMethod(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.paymentMethod.delete({ where: { id } });
  revalidatePath("/admin/orders/payment-methods");
}
