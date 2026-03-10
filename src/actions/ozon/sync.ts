"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { syncOzonStock } from "@/lib/ozon/syncOzonStock";
import { revalidatePath } from "next/cache";

export async function manualSyncOzon(
  _formState: DeleteFormState,
  _formData: FormData
): Promise<DeleteFormState> {
  try {
    await syncOzonStock("MANUAL");
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/ozon");
  revalidatePath("/admin");
  return { success: { message: "Синхронизация выполнена успешно" } };
}
