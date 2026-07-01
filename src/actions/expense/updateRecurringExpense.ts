"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { recurringExpenseSchema, RecurringExpenseFormState } from "@/zod/expense";
import { revalidatePath } from "next/cache";

// Updates name, amount, currency and isActive for a recurring expense template.
export async function updateRecurringExpense(
  id: string,
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
  const isActive = formData.get("isActive") === "true";

  await db.recurringExpense.update({
    where: { id },
    data: { name, amount: Math.round(amount * 100), currency, isActive },
  });

  revalidatePath("/admin/expenses/recurring");
  return {};
}
