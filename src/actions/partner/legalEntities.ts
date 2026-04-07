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
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function deletePartnerLegalEntity(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerLegalEntity.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
