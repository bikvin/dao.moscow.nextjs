"use server";

import { revalidatePath } from "next/cache";
import { recalculateOzonCommissions } from "@/lib/ozon/recalculateOzonCommissions";
import type { DeleteFormState } from "@/components/common/delete/deleteTypes";

// Server action wrapper for recalculateOzonCommissions — called from the button on the Ozon settings page.
export async function recalculateOzonOrders(
  _state: DeleteFormState,
  _fd: FormData
): Promise<DeleteFormState> {
  try {
    const { updated } = await recalculateOzonCommissions();
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
