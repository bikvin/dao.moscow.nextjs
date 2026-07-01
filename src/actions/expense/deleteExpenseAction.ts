"use server";

import { deleteExpense } from "./deleteExpense";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";

// Adapter wrapping deleteExpense to match the DeleteFormState interface used by DeleteDialog.
export async function deleteExpenseAction(
  _state: DeleteFormState,
  formData: FormData,
): Promise<DeleteFormState> {
  const id = formData.get("id") as string;
  try {
    await deleteExpense(id);
    return { success: { message: "Удалено" } };
  } catch {
    return { errors: { _form: ["Ошибка при удалении"] } };
  }
}
