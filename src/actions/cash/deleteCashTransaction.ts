"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

// Deletes a cash transaction by id.
export async function deleteCashTransaction(id: string): Promise<void> {
  await db.cashTransaction.delete({ where: { id } });
  revalidatePath("/admin/cash");
}
