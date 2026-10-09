"use server";

import { db } from "@/db";

// Dismisses the Ozon commission recalculation banner by deleting the stored result
// from settings. Called when the user clicks the close button on the warehouse page.
export async function dismissOzonRecalcBanner(): Promise<void> {
  await db.settings.deleteMany({ where: { field: "lastOzonCommissionRecalcResult" } });
}
