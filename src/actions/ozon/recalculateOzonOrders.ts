"use server";

import { revalidatePath } from "next/cache";
import { recalculateOzonCommissions, type CommissionChange } from "@/lib/ozon/recalculateOzonCommissions";

export type RecalculateState = {
  errors?: { _form?: string[] };
  success?: {
    message: string;
    changes?: CommissionChange[];
  };
};

// Server action wrapper for recalculateOzonCommissions — called from the button on the Ozon settings page.
export async function recalculateOzonOrders(
  _state: RecalculateState,
  _fd: FormData
): Promise<RecalculateState> {
  try {
    const { updated, changes } = await recalculateOzonCommissions();
    revalidatePath("/admin");
    const pending = changes.filter((c) => c.realTotalRub === null).length;
    return {
      success: {
        message: updated > 0
          ? `Обновлено заказов: ${updated}${pending > 0 ? `, ожидают данных: ${pending}` : ""}`
          : pending > 0
            ? `Обновлений нет, ожидают данных: ${pending}`
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
