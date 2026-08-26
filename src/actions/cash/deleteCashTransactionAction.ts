"use server";

import { deleteCashTransaction } from "./deleteCashTransaction";

// FormData wrapper for DeleteItemButton — reads "id" from the form fields.
export async function deleteCashTransactionAction(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await deleteCashTransaction(id);
}
