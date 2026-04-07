"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addPhoneSchema } from "@/zod/partner/partner";

export async function addPartnerPhone(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addPhoneSchema.safeParse({
    phone: formData.get("phone"),
    notes: formData.get("notes") || undefined,
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerPhone.create({
      data: {
        partnerId,
        phone: result.data.phone,
        notes: result.data.notes,
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function deletePartnerPhone(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerPhone.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
