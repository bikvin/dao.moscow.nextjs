import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch("https://www.cbr.ru/scripts/XML_daily.asp");
  const xml = await response.text();

  const $ = cheerio.load(xml, { xmlMode: true });

  const usdValute = $("Valute").filter((_, el) => {
    return $(el).find("CharCode").text() === "USD";
  });

  const rawValue = usdValute.find("Value").text();
  if (!rawValue) {
    return NextResponse.json({ error: "USD rate not found in CBR response" }, { status: 500 });
  }

  const rate = parseFloat(rawValue.replace(",", "."));

  await db.settings.upsert({
    where: { field: "usdOfficialRate" },
    update: { value: rate.toString() },
    create: { field: "usdOfficialRate", value: rate.toString() },
  });

  return NextResponse.json({ rate });
}
