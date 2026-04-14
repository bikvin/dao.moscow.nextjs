"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { shoppingMallSchema } from "@/zod/partner/partner";

export async function createShoppingMall(
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = shoppingMallSchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.shoppingMall.create({ data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/partners/shopping-malls");
  return { success: { message: "Добавлено" } };
}

export async function deleteShoppingMall(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.shoppingMall.delete({ where: { id } });
  revalidatePath("/admin/partners/shopping-malls");
}
