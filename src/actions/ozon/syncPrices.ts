"use server";

import { syncOzonPrices } from "@/lib/ozon/syncOzonPrices";
import { revalidatePath } from "next/cache";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";

export async function manualSyncOzonPrices(
  _formState: DeleteFormState,
  _formData: FormData
): Promise<DeleteFormState> {
  try {
    await syncOzonPrices("MANUAL");
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/ozon");
  return { success: { message: "Цены синхронизированы успешно" } };
}
