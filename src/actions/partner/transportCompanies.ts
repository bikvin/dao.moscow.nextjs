"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addTransportCompanySchema } from "@/zod/partner/partner";

export async function createTransportCompany(
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addTransportCompanySchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.transportCompany.create({ data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/partners/transport-companies");
  return { success: { message: "Добавлено" } };
}

export async function deleteTransportCompany(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.transportCompany.delete({ where: { id } });
  revalidatePath("/admin/partners/transport-companies");
}

export async function addPartnerTransportCompany(
  partnerId: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const tcId = formData.get("tcId") as string;
  const comment = (formData.get("comment") as string) || null;

  if (!tcId) {
    return { errors: { _form: ["Выберите транспортную компанию"] } };
  }

  try {
    await db.partnerTransportCompany.create({
      data: { partnerId, transportCompanyId: tcId, comment },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function updatePartnerTransportCompanyComment(
  partnerId: string,
  linkId: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const comment = (formData.get("comment") as string) || null;

  try {
    await db.partnerTransportCompany.update({
      where: { id: linkId },
      data: { comment },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Сохранено" } };
}

export async function removePartnerTransportCompany(formData: FormData): Promise<void> {
  const partnerId = formData.get("partnerId") as string;
  const linkId = formData.get("linkId") as string;
  await db.partnerTransportCompany.delete({ where: { id: linkId } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
