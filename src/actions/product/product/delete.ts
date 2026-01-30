"use server";

import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import { db } from "@/db";
import { deleteUnusedFromS3 } from "@/lib/awsS3/deleteUnusedFromS3";
import { revalidatePath } from "next/cache";

export async function deleteProduct(
  _formState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return {
      errors: {
        _form: ["Что-то пошло не так. Id не найден или неверный."],
      },
    };
  }

  try {
    const product = await db.product.findUnique({
      where: { id: id },
    });

    if (!product) throw new Error("Group not found");

    await db.product.delete({
      where: {
        id: id,
      },
    });
    await deleteUnusedFromS3(`${product.imageGroupName}`, "[]");
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Something went wrong"],
      },
    };
  }

  revalidatePath("/admin/products");

  return { success: { message: "Удалено успешно" } };
}
