import { syncYandexStock } from "@/lib/yandex/syncYandexStock";
import { syncOzonStock } from "@/lib/ozon/syncOzonStock";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    await syncYandexStock("AUTO");
    results.yandex = "ok";
  } catch (err: unknown) {
    results.yandex = err instanceof Error ? err.message : "error";
  }

  try {
    await syncOzonStock("AUTO");
    results.ozon = "ok";
  } catch (err: unknown) {
    results.ozon = err instanceof Error ? err.message : "error";
  }

  return NextResponse.json(results);
}
