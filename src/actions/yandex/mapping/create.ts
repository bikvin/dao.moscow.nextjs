"use server";

import { db } from "@/db";
import { createMappingSchema } from "@/zod/yandex/mapping";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface MappingFormState {
  errors: {
    productId?: string[];
    yandexSku?: string[];
    buffer?: string[];
    _form?: string[];
  };
}

export async function createYandexMapping(
  _formState: MappingFormState,
  formData: FormData
): Promise<MappingFormState> {
  const result = createMappingSchema.safeParse({
    productId: formData.get("productId"),
    yandexSku: formData.get("yandexSku"),
    buffer: formData.get("buffer"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    await db.yandexMarketMapping.create({ data: result.data });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/yandex/mappings");
  redirect("/admin/yandex/mappings");
}
