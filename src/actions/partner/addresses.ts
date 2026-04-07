"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "./PartnerFormState";
import { addAddressSchema } from "@/zod/partner/partner";

export async function addPartnerAddress(
  partnerId: string,
  formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addAddressSchema.safeParse({
    type: formData.get("type"),
    address: formData.get("address"),
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  try {
    await db.partnerAddress.create({
      data: { partnerId, type: result.data.type, address: result.data.address },
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: { message: "Добавлено" } };
}

export async function deletePartnerAddress(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const partnerId = formData.get("partnerId") as string;
  await db.partnerAddress.delete({ where: { id } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
