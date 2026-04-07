"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addNameSchema } from "@/zod/partner/partner";

export async function addPartnerName(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addNameSchema.safeParse({ name: formData.get("name") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerName.create({
      data: { partnerId, name: result.data.name, isPrimary: false },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function setPrimaryPartnerName(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.$transaction([
    db.partnerName.updateMany({ where: { partnerId }, data: { isPrimary: false } }),
    db.partnerName.update({ where: { id }, data: { isPrimary: true } }),
  ]);
  revalidatePath(`/admin/partners/${partnerId}`);
}

export async function deletePartnerName(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerName.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
