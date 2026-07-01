"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidatePath } from "next/cache";

// Deletes a recurring expense template by id.
export async function deleteRecurringExpense(id: string): Promise<void> {
  await requireAdmin();
  await db.recurringExpense.delete({ where: { id } });
  revalidatePath("/admin/expenses/recurring");
}
