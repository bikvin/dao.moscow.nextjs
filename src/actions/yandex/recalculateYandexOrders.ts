"use server";

import { revalidatePath } from "next/cache";
import { recalculateYandexCommissions } from "@/lib/yandex/recalculateYandexCommissions";
import type { DeleteFormState } from "@/components/common/delete/deleteTypes";

// Server action wrapper for recalculateYandexCommissions — called from the button on the Yandex settings page.
export async function recalculateYandexOrders(
  _state: DeleteFormState,
  _fd: FormData
): Promise<DeleteFormState> {
  try {
    const { updated } = await recalculateYandexCommissions();
    revalidatePath("/admin");
    return {
      success: {
        message: updated > 0
          ? `Обновлено заказов: ${updated}`
          : "Нет новых данных для пересчёта",
      },
    };
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Ошибка при пересчёте"] } };
  }
}
