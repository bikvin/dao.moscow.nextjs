"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidatePath } from "next/cache";

// Deletes a single expense by id.
export async function deleteExpense(id: string): Promise<void> {
  await requireAdmin();
  await db.expense.delete({ where: { id } });
  revalidatePath("/admin/expenses");
}
