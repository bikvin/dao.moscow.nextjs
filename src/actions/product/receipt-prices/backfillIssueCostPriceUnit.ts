"use server";

import { db } from "@/db";
import { PriceUnitEnum, ProductIssueEnum } from "@prisma/client";

// One-time backfill: sets costPriceUnit = M2 for all SALE issues that have costPrice set but no unit.
// Safe to re-run — only touches rows where costPriceUnit is still null.
export async function backfillIssueCostPriceUnit(): Promise<{ updatedIssues: number }> {
  const { count } = await db.productIssue.updateMany({
    where: { type: ProductIssueEnum.SALE, costPrice: { not: null }, costPriceUnit: null },
    data: { costPriceUnit: PriceUnitEnum.M2 },
  });

  return { updatedIssues: count };
}
