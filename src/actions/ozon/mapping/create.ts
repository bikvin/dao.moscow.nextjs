"use server";

import { db } from "@/db";
import { createOzonMappingSchema } from "@/zod/ozon/mapping";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface OzonMappingFormState {
  errors: {
    productId?: string[];
    ozonOfferId?: string[];
    buffer?: string[];
    divisor?: string[];
    _form?: string[];
  };
}

export async function createOzonMapping(
  _formState: OzonMappingFormState,
  formData: FormData
): Promise<OzonMappingFormState> {
  const result = createOzonMappingSchema.safeParse({
    productId: formData.get("productId"),
    ozonOfferId: formData.get("ozonOfferId"),
    buffer: formData.get("buffer"),
    divisor: formData.get("divisor"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    await db.ozonMapping.create({ data: result.data });
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
