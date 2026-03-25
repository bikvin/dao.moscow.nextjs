"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChipSizeFormState } from "./ChipSizeFormState";
import { createChipSizeSchema } from "@/zod/product/chip-size";

export async function createChipSize(
  formState: ChipSizeFormState,
  formData: FormData
): Promise<ChipSizeFormState> {
  try {
    const result = createChipSizeSchema.safeParse({
      name: formData.get("name"),
      displayOrder: formData.get("displayOrder"),
    });

    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors };
    }

    await db.chipSize.create({
      data: {
        name: result.data.name,
        displayOrder: result.data.displayOrder ? Number(result.data.displayOrder) : null,
      },
    });
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/products/chip-sizes");
  redirect("/admin/products/chip-sizes");
}
