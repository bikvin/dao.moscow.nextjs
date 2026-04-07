"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addLegalEntitySchema } from "@/zod/partner/partner";

export async function addPartnerLegalEntity(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addLegalEntitySchema.safeParse({
    name: formData.get("name"),
    inn: formData.get("inn") || undefined,
    kpp: formData.get("kpp") || undefined,
    ogrn: formData.get("ogrn") || undefined,
    legalAddress: formData.get("legalAddress") || undefined,
    actualAddress: formData.get("actualAddress") || undefined,
    phones: formData.get("phones") || undefined,
    bankName: formData.get("bankName") || undefined,
    bik: formData.get("bik") || undefined,
    checkingAccount: formData.get("checkingAccount") || undefined,
    correspondentAccount: formData.get("correspondentAccount") || undefined,
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerLegalEntity.create({
      data: {
        partnerId,
        name: result.data.name,
        inn: result.data.inn,
        kpp: result.data.kpp,
        ogrn: result.data.ogrn,
        legalAddress: result.data.legalAddress,
        actualAddress: result.data.actualAddress,
        phones: result.data.phones,
        bankName: result.data.bankName,
        bik: result.data.bik,
        checkingAccount: result.data.checkingAccount,
        correspondentAccount: result.data.correspondentAccount,
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function updatePartnerLegalEntity(
  partnerId: string,
  id: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addLegalEntitySchema.safeParse({
    name: formData.get("name"),
    inn: formData.get("inn") || undefined,
    kpp: formData.get("kpp") || undefined,
    ogrn: formData.get("ogrn") || undefined,
    legalAddress: formData.get("legalAddress") || undefined,
    actualAddress: formData.get("actualAddress") || undefined,
    phones: formData.get("phones") || undefined,
    bankName: formData.get("bankName") || undefined,
    bik: formData.get("bik") || undefined,
    checkingAccount: formData.get("checkingAccount") || undefined,
    correspondentAccount: formData.get("correspondentAccount") || undefined,
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerLegalEntity.update({
      where: { id },
      data: {
        name: result.data.name,
        inn: result.data.inn ?? null,
        kpp: result.data.kpp ?? null,
        ogrn: result.data.ogrn ?? null,
        legalAddress: result.data.legalAddress ?? null,
        actualAddress: result.data.actualAddress ?? null,
        phones: result.data.phones ?? null,
        bankName: result.data.bankName ?? null,
        bik: result.data.bik ?? null,
        checkingAccount: result.data.checkingAccount ?? null,
        correspondentAccount: result.data.correspondentAccount ?? null,
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Сохранено" } };
}

export async function deletePartnerLegalEntity(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerLegalEntity.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
