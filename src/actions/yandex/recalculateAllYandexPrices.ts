"use server";

import { db } from "@/db";
import { recalculateYandexPrice } from "@/lib/yandex/recalculateYandexPrice";
import { revalidatePath } from "next/cache";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";

export async function recalculateAllYandexPrices(
  _formState: DeleteFormState,
  _formData: FormData
): Promise<DeleteFormState> {
  try {
    const mappings = await db.yandexMarketMapping.findMany({ select: { productId: true } });
    await Promise.all(mappings.map((m) => recalculateYandexPrice(m.productId)));
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/yandex/mappings");
  return { success: { message: `Цены пересчитаны` } };
}
