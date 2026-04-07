"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addWebsiteSchema } from "@/zod/partner/partner";

export async function addPartnerWebsite(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addWebsiteSchema.safeParse({ url: formData.get("url") });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerWebsite.create({ data: { partnerId, url: result.data.url } });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function deletePartnerWebsite(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerWebsite.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
