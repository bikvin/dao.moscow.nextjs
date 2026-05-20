"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function deleteInvoice(formData: FormData): Promise<void> {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    throw new Error("Id не найден или неверный");
  }

  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Счёт не найден");

  await db.invoice.delete({ where: { id } });

  revalidatePath("/admin/invoices");
}
