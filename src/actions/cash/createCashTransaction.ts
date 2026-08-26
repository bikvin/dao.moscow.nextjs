"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { cashTransactionSchema, CashTransactionFormState } from "@/zod/cash";
import { revalidatePath } from "next/cache";

// Creates a new cash transaction (IN or OUT) for the given currency account.
export async function createCashTransaction(
  _prev: CashTransactionFormState,
  formData: FormData,
): Promise<CashTransactionFormState> {
  await requireAdmin();

  const parsed = cashTransactionSchema.safeParse({
    date: formData.get("date"),
    type: formData.get("type"),
    currency: formData.get("currency"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { date, type, currency, amount, description } = parsed.data;

  await db.cashTransaction.create({
    data: {
      date: new Date(date),
      type,
      currency,
      amount: Math.round(amount * 100),
      description,
    },
  });

  revalidatePath("/admin/cash");
  return {};
}
