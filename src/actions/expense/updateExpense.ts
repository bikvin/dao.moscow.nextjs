"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { expenseSchema, ExpenseFormState } from "@/zod/expense";
import { revalidatePath } from "next/cache";

// Updates an existing expense entry.
export async function updateExpense(
  id: string,
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await requireAdmin();

  const parsed = expenseSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, amount, currency, date } = parsed.data;

  await db.expense.update({
    where: { id },
    data: {
      name,
      amount: Math.round(amount * 100),
      currency,
      date: new Date(date),
    },
  });

  revalidatePath("/admin/expenses");
  return {};
}
