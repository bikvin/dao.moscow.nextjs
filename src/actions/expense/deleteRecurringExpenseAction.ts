"use server";

import { deleteRecurringExpense } from "./deleteRecurringExpense";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";

// Adapter wrapping deleteRecurringExpense to match the DeleteFormState interface used by DeleteDialog.
export async function deleteRecurringExpenseAction(
  _state: DeleteFormState,
  formData: FormData,
): Promise<DeleteFormState> {
  const id = formData.get("id") as string;
  try {
    await deleteRecurringExpense(id);
    return { success: { message: "Удалено" } };
  } catch {
    return { errors: { _form: ["Ошибка при удалении"] } };
  }
}
