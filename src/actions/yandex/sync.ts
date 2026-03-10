"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { syncYandexStock } from "@/lib/yandex/syncYandexStock";
import { revalidatePath } from "next/cache";

export async function manualSyncYandex(
  _formState: DeleteFormState,
  _formData: FormData
): Promise<DeleteFormState> {
  try {
    await syncYandexStock("MANUAL");
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/yandex");
  revalidatePath("/admin");

  return { success: { message: "Синхронизация выполнена успешно" } };
}
