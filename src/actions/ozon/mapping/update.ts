"use server";

import { db } from "@/db";
import { updateOzonMappingSchema } from "@/zod/ozon/mapping";
import { OzonMappingFormState } from "./create";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateOzonMapping(
  _formState: OzonMappingFormState,
  formData: FormData
): Promise<OzonMappingFormState> {
  const result = updateOzonMappingSchema.safeParse({
    id: formData.get("id"),
    productId: formData.get("productId"),
    ozonOfferId: formData.get("ozonOfferId"),
    buffer: formData.get("buffer"),
    divisor: formData.get("divisor"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { id, ...data } = result.data;

  try {
    await db.ozonMapping.update({ where: { id }, data });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/ozon/mappings");
  redirect("/admin/ozon/mappings");
}
