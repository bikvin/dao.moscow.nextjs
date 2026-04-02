"use server";

import { db } from "@/db";
import { recalculateOzonPrice } from "@/lib/ozon/recalculateOzonPrice";
import { revalidatePath } from "next/cache";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";

export async function recalculateAllOzonPrices(
  _formState: DeleteFormState,
  _formData: FormData
): Promise<DeleteFormState> {
  try {
    const mappings = await db.ozonMapping.findMany({ select: { productId: true } });
    await Promise.all(mappings.map((m) => recalculateOzonPrice(m.productId)));
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/ozon/mappings");
  return { success: { message: "Цены пересчитаны" } };
}
