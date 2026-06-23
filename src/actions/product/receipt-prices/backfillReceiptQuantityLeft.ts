"use server";

import { db } from "@/db";

// Sets quantityLeft = quantity for all receipts where quantityLeft is still 0.
// Used as a one-time backfill for receipts created before FIFO tracking was introduced.
// Groups by distinct quantity value to minimise the number of updateMany calls.
export async function backfillReceiptQuantityLeft(): Promise<{ updated: number }> {
  const receipts = await db.productReceipt.findMany({
    where: { quantityLeft: 0 },
    select: { id: true, quantity: true },
  });

  if (receipts.length === 0) return { updated: 0 };

  // Group receipt IDs by their quantity value
  const groups = new Map<number, string[]>();
  for (const r of receipts) {
    if (!groups.has(r.quantity)) groups.set(r.quantity, []);
    groups.get(r.quantity)!.push(r.id);
  }

  await Promise.all(
    [...groups.entries()].map(([quantity, ids]) =>
      db.productReceipt.updateMany({
        where: { id: { in: ids } },
        data: { quantityLeft: quantity },
      })
    )
  );

  return { updated: receipts.length };
}
