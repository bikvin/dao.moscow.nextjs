"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addContactPersonSchema } from "@/zod/partner/partner";

export async function addPartnerContactPerson(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addContactPersonSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerContactPerson.create({
      data: {
        partnerId,
        name: result.data.name,
        role: result.data.role,
        notes: result.data.notes,
      },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function deletePartnerContactPerson(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerContactPerson.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
