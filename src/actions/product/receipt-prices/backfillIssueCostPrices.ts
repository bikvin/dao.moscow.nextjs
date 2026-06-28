"use server";

import { db } from "@/db";
import { consumeFifoStock } from "@/lib/product/consumeFifoStock";
import { ProductIssueEnum } from "@prisma/client";

// One-time backfill: calculates FIFO costPrice for all SALE issues that have none.
// Processes issues per variant in chronological order so FIFO consumption is historically correct.
// Also brings quantityLeft on receipts to the correct post-consumption state as a side effect.
// Safe to re-run — only touches issues where costPrice is still null.
export async function backfillIssueCostPrices(): Promise<{ updatedIssues: number }> {
  const variantIds = await db.productIssue
    .findMany({
      where: { type: ProductIssueEnum.SALE, costPrice: null },
      select: { productVariantId: true },
      distinct: ["productVariantId"],
    })
    .then((rows) => rows.map((r) => r.productVariantId));

  let updatedIssues = 0;

  for (const variantId of variantIds) {
    const issues = await db.productIssue.findMany({
      where: { productVariantId: variantId, type: ProductIssueEnum.SALE, costPrice: null },
      orderBy: [{ issueDate: "asc" }, { createdAt: "asc" }],
      select: { id: true, quantity: true },
    });

    await db.$transaction(async (tx) => {
      for (const issue of issues) {
        const cost = await consumeFifoStock(tx, variantId, issue.quantity);
        if (cost) {
          await tx.productIssue.update({
            where: { id: issue.id },
            data: cost,
          });
          updatedIssues++;
        }
      }
    });
  }

  return { updatedIssues };
}
