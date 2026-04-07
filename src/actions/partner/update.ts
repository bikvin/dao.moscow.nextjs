"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { PartnerFormState } from "./PartnerFormState";
import { updatePartnerSchema } from "@/zod/partner/partner";

export async function updatePartner(
  id: string,
  formState: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  const result = updatePartnerSchema.safeParse({
    status: formData.get("status"),
    prospectNotes: formData.get("prospectNotes") || undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    await db.partner.update({
      where: { id },
      data: {
        status: result.data.status,
        prospectNotes: result.data.prospectNotes ?? null,
      },
    });
  } catch (err: unknown) {
    return {
      errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] },
    };
  }

  revalidatePath(`/admin/partners/${id}`);
  revalidatePath("/admin/partners");
  return { success: { message: "Сохранено" } };
}
