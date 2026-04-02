import { syncYandexStock } from "@/lib/yandex/syncYandexStock";
import { syncOzonStock } from "@/lib/ozon/syncOzonStock";
import { syncYandexPrices } from "@/lib/yandex/syncYandexPrices";
import { syncOzonPrices } from "@/lib/ozon/syncOzonPrices";
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

  return NextResponse.json(results);
}
