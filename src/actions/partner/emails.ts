"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addEmailSchema } from "@/zod/partner/partner";

export async function addPartnerEmail(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addEmailSchema.safeParse({
    email: formData.get("email"),
    notes: formData.get("notes") || undefined,
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerEmail.create({
      data: {
        partnerId,
        email: result.data.email,
        notes: result.data.notes,
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function deletePartnerEmail(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerEmail.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
