"use server";

import { revalidatePath } from "next/cache";
import { recalculateYandexCommissions, type YandexCommissionChange } from "@/lib/yandex/recalculateYandexCommissions";

export type RecalculateYandexState = {
  errors?: { _form?: string[] };
  success?: { message: string; changes?: YandexCommissionChange[] };
};

// Server action wrapper for recalculateYandexCommissions — called from the button on the Yandex settings page.
export async function recalculateYandexOrders(
  _state: RecalculateYandexState,
  _fd: FormData
): Promise<RecalculateYandexState> {
  try {
    const { updated, changes } = await recalculateYandexCommissions();
    revalidatePath("/admin");
    return {
      success: {
        message: updated > 0
          ? `Обновлено заказов: ${updated}`
          : "Все заказы урегулированы",
        changes: changes.length > 0 ? changes : undefined,
      },
    };
  } catch (err) {
    let message = "Ошибка при пересчёте";
    if (err instanceof Error) {
      message = err.message;
      const cause = (err as NodeJS.ErrnoException).cause;
      if (cause instanceof Error) message += `: ${cause.message}`;
    }
    return { errors: { _form: [message] } };
  }
}
