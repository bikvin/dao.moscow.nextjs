"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidatePath } from "next/cache";

// Creates an Expense from the given OUT cash transaction and links them via expenseId.
export async function linkCashToExpense(txId: string): Promise<void> {
  await requireAdmin();

  const tx = await db.cashTransaction.findUniqueOrThrow({ where: { id: txId } });

  const expense = await db.expense.create({
    data: {
      name: tx.description ?? "Без описания",
      amount: tx.amount,
      currency: tx.currency,
      date: tx.date,
    },
  });

  await db.cashTransaction.update({
    where: { id: txId },
    data: { expenseId: expense.id },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/expenses");
}
