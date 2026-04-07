"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addCitySchema } from "@/zod/partner/partner";

export async function createCity(
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addCitySchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.city.create({ data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/partners/cities");
  return { success: { message: "Добавлено" } };
}

export async function deleteCity(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.city.delete({ where: { id } });
  revalidatePath("/admin/partners/cities");
}

export async function addPartnerCity(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const cityId = formData.get("cityId") as string;

  if (!cityId) {
    return { errors: { _form: ["Выберите город"] } };
  }

  try {
    await db.partner.update({
      where: { id: partnerId },
      data: { cities: { connect: { id: cityId } } },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function removePartnerCity(formData: FormData): Promise<void> {
  const partnerId = formData.get("partnerId") as string;
  const cityId = formData.get("cityId") as string;
  await db.partner.update({
    where: { id: partnerId },
    data: { cities: { disconnect: { id: cityId } } },
  });
  revalidatePath(`/admin/partners/${partnerId}`);
}
