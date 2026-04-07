"use server";

import { db } from "@/db";
import { redirect } from "next/navigation";
import { PartnerFormState } from "./PartnerFormState";
import { createPartnerSchema } from "@/zod/partner/partner";
import { PartnerStatusEnum } from "@prisma/client";

export async function createPartner(
  formState: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  const result = createPartnerSchema.safeParse({
    name: formData.get("name"),
    status: formData.get("status") ?? PartnerStatusEnum.ACTIVE,
    prospectNotes: formData.get("prospectNotes") || undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  let partnerId: string;
  try {
    const partner = await db.partner.create({
      data: {
        status: result.data.status,
        prospectNotes: result.data.prospectNotes,
        names: {
          create: { name: result.data.name, isPrimary: true },
        },
      },
    });
    partnerId = partner.id;
  } catch (err: unknown) {
    return {
      errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] },
    };
  }

  redirect(`/admin/partners/${partnerId}`);
}
