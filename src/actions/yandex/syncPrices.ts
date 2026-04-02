"use server";

import { syncYandexPrices } from "@/lib/yandex/syncYandexPrices";
import { revalidatePath } from "next/cache";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";

export async function manualSyncYandexPrices(
  _formState: DeleteFormState,
  _formData: FormData
): Promise<DeleteFormState> {
  try {
    await syncYandexPrices("MANUAL");
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/yandex");
  return { success: { message: "Цены синхронизированы успешно" } };
}
