"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { recurringExpenseSchema, RecurringExpenseFormState } from "@/zod/expense";
import { revalidatePath } from "next/cache";

// Creates a new recurring expense template.
export async function createRecurringExpense(
  _prev: RecurringExpenseFormState,
  formData: FormData,
): Promise<RecurringExpenseFormState> {
  await requireAdmin();

  const parsed = recurringExpenseSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, amount, currency } = parsed.data;

  await db.recurringExpense.create({
    data: { name, amount: Math.round(amount * 100), currency },
  });

  revalidatePath("/admin/expenses/recurring");
  return {};
}
