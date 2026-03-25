"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChipSizeFormState } from "./ChipSizeFormState";
import { editChipSizeSchema } from "@/zod/product/chip-size";

export async function updateChipSize(
  formState: ChipSizeFormState,
  formData: FormData
): Promise<ChipSizeFormState> {
  const result = editChipSizeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    displayOrder: formData.get("displayOrder"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    await db.chipSize.update({
      where: { id: result.data.id },
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
