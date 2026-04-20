"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { z } from "zod";

const deliveryMethodSchema = z.object({
  name: z.string().min(1, "Введите название"),
  defaultPriceRub: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().nonnegative().nullable()
  ),
});

export async function createDeliveryMethod(
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = deliveryMethodSchema.safeParse({
    name: formData.get("name"),
    defaultPriceRub: formData.get("defaultPriceRub"),
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  const priceRub = result.data.defaultPriceRub;

  try {
    await db.deliveryMethod.create({
      data: {
        name: result.data.name,
        defaultPriceRub: priceRub !== null ? priceRub * 100 : null,
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/orders/delivery-methods");
  return { success: { message: "Добавлено" } };
}

export async function updateDeliveryMethod(
  id: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = deliveryMethodSchema.safeParse({
    name: formData.get("name"),
    defaultPriceRub: formData.get("defaultPriceRub"),
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  const priceRub = result.data.defaultPriceRub;

  try {
    await db.deliveryMethod.update({
      where: { id },
      data: {
        name: result.data.name,
        defaultPriceRub: priceRub !== null ? priceRub * 100 : null,
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/orders/delivery-methods");
  return { success: { message: "Сохранено" } };
}

export async function deleteDeliveryMethod(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.deliveryMethod.delete({ where: { id } });
  revalidatePath("/admin/orders/delivery-methods");
}
