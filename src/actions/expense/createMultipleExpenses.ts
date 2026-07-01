"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { CurrencyEnum } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type ExpenseInput = {
  name: string;
  amount: number;
  currency: CurrencyEnum;
  date: string;
};

// Creates multiple expense entries in a single transaction.
export async function createMultipleExpenses(expenses: ExpenseInput[]): Promise<void> {
  await requireAdmin();

  await db.expense.createMany({
    data: expenses.map((e) => ({
      name: e.name,
      amount: Math.round(e.amount * 100),
      currency: e.currency,
      date: new Date(e.date),
    })),
  });

  revalidatePath("/admin/expenses");
}
