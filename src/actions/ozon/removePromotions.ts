"use server";

import { removeOzonPromotions } from "@/lib/ozon/removeOzonPromotions";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";

export async function removeOzonPromotionsAction(
  _formState: DeleteFormState,
  _formData: FormData
): Promise<DeleteFormState> {
  try {
    const { removed, promotions } = await removeOzonPromotions();
    return {
      success: {
        message:
          removed === 0
            ? "Нет активных акций"
            : `Удалено ${removed} товаров из ${promotions} акций`,
      },
    };
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }
}
