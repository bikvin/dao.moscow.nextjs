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

  function parseRate(charCode: string): number | null {
    const valute = $("Valute").filter((_, el) => $(el).find("CharCode").text() === charCode);
    const rawValue = valute.find("Value").text();
    const nominal = parseInt(valute.find("Nominal").text() || "1", 10);
    if (!rawValue) return null;
    return parseFloat(rawValue.replace(",", ".")) / nominal;
  }

  const usdRate = parseRate("USD");
  const rmbRate = parseRate("CNY");

  if (!usdRate) {
    return NextResponse.json({ error: "USD rate not found in CBR response" }, { status: 500 });
  }

  await db.settings.upsert({
    where: { field: "usdOfficialRate" },
    update: { value: usdRate.toString() },
    create: { field: "usdOfficialRate", value: usdRate.toString() },
  });

  if (rmbRate) {
    await db.settings.upsert({
      where: { field: "rmbOfficialRate" },
      update: { value: rmbRate.toString() },
      create: { field: "rmbOfficialRate", value: rmbRate.toString() },
    });
  }

  const rate = usdRate;

  const [modeSetting, markupSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "usdMainRateMode" } }),
    db.settings.findUnique({ where: { field: "usdMainRateMarkup" } }),
  ]);

  const mode = modeSetting?.value ?? "official";

  if (mode === "official") {
    await db.settings.upsert({
      where: { field: "usdMainRate" },
      update: { value: rate.toString() },
      create: { field: "usdMainRate", value: rate.toString() },
    });
  } else if (mode === "markup") {
    const markup = parseFloat(markupSetting?.value ?? "0");
    const mainRate = rate * (1 + markup / 100);
    await db.settings.upsert({
      where: { field: "usdMainRate" },
      update: { value: mainRate.toString() },
      create: { field: "usdMainRate", value: mainRate.toString() },
    });
  }

  return NextResponse.json({ usdRate, rmbRate, mode });
}
