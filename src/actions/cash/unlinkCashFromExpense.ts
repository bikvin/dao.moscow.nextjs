"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidatePath } from "next/cache";

// Deletes the linked Expense and clears the expenseId on the cash transaction.
export async function unlinkCashFromExpense(txId: string): Promise<void> {
  await requireAdmin();

  const tx = await db.cashTransaction.findUniqueOrThrow({ where: { id: txId } });

  if (tx.expenseId) {
    await db.expense.delete({ where: { id: tx.expenseId } });
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin/expenses");
}
