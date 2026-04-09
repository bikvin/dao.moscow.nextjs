"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { sampleTypeSchema } from "@/zod/partner/partner";

export async function createSampleType(
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = sampleTypeSchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.sampleType.create({ data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/partners/sample-types");
  return { success: { message: "Добавлено" } };
}

export async function updateSampleType(
  id: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = sampleTypeSchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.sampleType.update({ where: { id }, data: { name: result.data.name } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin/partners/sample-types");
  return { success: { message: "Сохранено" } };
}

export async function deleteSampleType(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.sampleType.delete({ where: { id } });
  revalidatePath("/admin/partners/sample-types");
}

export async function addSampleTypeToAddress(
  partnerId: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const addressId = formData.get("addressId") as string;
  const sampleTypeId = formData.get("sampleTypeId") as string;

  if (!sampleTypeId) {
    return { errors: { _form: ["Выберите тип образца"] } };
  }

  try {
    await db.partnerAddress.update({
      where: { id: addressId },
      data: { sampleTypes: { connect: { id: sampleTypeId } } },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function removeSampleTypeFromAddress(formData: FormData): Promise<void> {
  const partnerId = formData.get("partnerId") as string;
  const addressId = formData.get("addressId") as string;
  const sampleTypeId = formData.get("sampleTypeId") as string;

  await db.partnerAddress.update({
    where: { id: addressId },
    data: { sampleTypes: { disconnect: { id: sampleTypeId } } },
  });

  revalidatePath(`/admin/partners/${partnerId}`);
}
