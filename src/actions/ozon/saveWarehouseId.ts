"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { BufferFormState } from "@/actions/yandex/saveDefaultBuffer";

export async function saveOzonWarehouseId(
  _formState: BufferFormState,
  formData: FormData
): Promise<BufferFormState> {
  const raw = formData.get("warehouseId");
  const value = raw?.toString().trim() ?? "";

  if (!value) {
    return { errors: { _form: ["Укажите ID склада"] } };
  }
  if (isNaN(parseInt(value, 10))) {
    return { errors: { _form: ["ID склада должен быть числом"] } };
  }

  try {
    await db.settings.upsert({
      where: { field: "ozonWarehouseId" },
      update: { value },
      create: { field: "ozonWarehouseId", value },
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Сохранено" } };
}
