"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addCitySchema } from "@/zod/partner/partner";

export async function addPartnerCity(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addCitySchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    const city = await db.city.upsert({
      where: { name: result.data.name },
      update: {},
      create: { name: result.data.name },
    });

    await db.partner.update({
      where: { id: partnerId },
      data: { cities: { connect: { id: city.id } } },
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
