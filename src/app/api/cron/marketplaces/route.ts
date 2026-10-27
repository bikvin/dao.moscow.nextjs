export const dynamic = "force-dynamic";

import { db } from "@/db";
import { syncYandexStock } from "@/lib/yandex/syncYandexStock";
import { syncOzonStock } from "@/lib/ozon/syncOzonStock";
import { syncYandexPrices } from "@/lib/yandex/syncYandexPrices";
import { syncOzonPrices } from "@/lib/ozon/syncOzonPrices";
import { removeOzonPromotions } from "@/lib/ozon/removeOzonPromotions";
import { recalculateYandexCommissions } from "@/lib/yandex/recalculateYandexCommissions";
import { recalculateOzonCommissions } from "@/lib/ozon/recalculateOzonCommissions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    await syncYandexStock("AUTO");
    results.yandexStock = "ok";
  } catch (err: unknown) {
    results.yandexStock = err instanceof Error ? err.message : "error";
  }

  try {
    await syncYandexPrices("AUTO");
    results.yandexPrices = "ok";
  } catch (err: unknown) {
    results.yandexPrices = err instanceof Error ? err.message : "error";
  }

  try {
    await syncOzonStock("AUTO");
    results.ozonStock = "ok";
  } catch (err: unknown) {
    results.ozonStock = err instanceof Error ? err.message : "error";
  }

  try {
    await syncOzonPrices("AUTO");
    results.ozonPrices = "ok";
  } catch (err: unknown) {
    results.ozonPrices = err instanceof Error ? err.message : "error";
  }

  try {
    const { removed, promotions } = await removeOzonPromotions();
    results.ozonPromotions = removed === 0 ? "no active promotions" : `removed ${removed} products from ${promotions} promotions`;
  } catch (err: unknown) {
    results.ozonPromotions = err instanceof Error ? err.message : "error";
  }

  try {
    const { updated, changes } = await recalculateYandexCommissions();
    results.yandexCommissions = updated > 0 ? `updated ${updated} orders` : "no orders to update";
    void changes; // changes available for future use (e.g. warehouse banner)
  } catch (err: unknown) {
    results.yandexCommissions = err instanceof Error ? err.message : "error";
  }

  try {
    const { updated, changes } = await recalculateOzonCommissions();
    results.ozonCommissions = updated > 0 ? `updated ${updated} orders` : "no orders to update";
    if (updated > 0) {
      await db.settings.upsert({
        where: { field: "lastOzonCommissionRecalcResult" },
        update: { value: JSON.stringify({ updated, changes, at: new Date().toISOString() }) },
        create: { field: "lastOzonCommissionRecalcResult", value: JSON.stringify({ updated, changes, at: new Date().toISOString() }) },
      });
    }
  } catch (err: unknown) {
    results.ozonCommissions = err instanceof Error ? err.message : "error";
  }

  return NextResponse.json(results);
}
