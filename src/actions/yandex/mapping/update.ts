"use server";

import { db } from "@/db";
import { updateMappingSchema } from "@/zod/yandex/mapping";
import { MappingFormState } from "./create";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateYandexMapping(
  _formState: MappingFormState,
  formData: FormData
): Promise<MappingFormState> {
  const result = updateMappingSchema.safeParse({
    id: formData.get("id"),
    productId: formData.get("productId"),
    yandexSku: formData.get("yandexSku"),
    buffer: formData.get("buffer"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { id, ...data } = result.data;

  try {
    await db.yandexMarketMapping.update({ where: { id }, data });
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
