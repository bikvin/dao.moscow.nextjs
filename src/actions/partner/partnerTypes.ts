"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { partnerTypeSchema } from "@/zod/partner/partner";

export async function createPartnerType(
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = partnerTypeSchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerType.create({ data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/partners/partner-types");
  return { success: { message: "Добавлено" } };
}

export async function deletePartnerType(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.partnerType.delete({ where: { id } });
  revalidatePath("/admin/partners/partner-types");
}

export async function addPartnerType(
  partnerId: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const partnerTypeId = formData.get("partnerTypeId") as string;

  if (!partnerTypeId) {
    return { errors: { _form: ["Выберите тип"] } };
  }

  try {
    await db.partner.update({
      where: { id: partnerId },
      data: { partnerTypes: { connect: { id: partnerTypeId } } },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function removePartnerType(formData: FormData): Promise<void> {
  const partnerId = formData.get("partnerId") as string;
  const partnerTypeId = formData.get("partnerTypeId") as string;
  await db.partner.update({
    where: { id: partnerId },
    data: { partnerTypes: { disconnect: { id: partnerTypeId } } },
  });
  revalidatePath(`/admin/partners/${partnerId}`);
}
