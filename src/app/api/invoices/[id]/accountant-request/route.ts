export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/db";
import { PriceUnitEnum } from "@prisma/client";

// Generates a simple accountant request form for a bank invoice.
// Columns: Артикул | Покупатель | кол-во м2 | цена $ | Цена за м2 | Стоимость
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: {
      order: { select: { sequenceNumber: true, deliveryMethod: { select: { name: true } } } },
      items: {
        include: {
          product: { select: { sku: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Счёт не найден" }, { status: 404 });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Бух");

  ws.columns = [
    { key: "sku",      width: 20 }, // A - Артикул
    { key: "buyer",    width: 28 }, // B - Покупатель
    { key: "m2",       width: 12 }, // C - кол-во м2
    { key: "rubPerM2", width: 14 }, // D - Цена за м2
    { key: "total",    width: 16 }, // E - Стоимость
  ];

  const font = { name: "Arial", size: 10 };
  const center: ExcelJS.Alignment = { horizontal: "center", vertical: "middle" };
  const borderColor = { argb: "FFC1C1C1" };
  const thinBorder: ExcelJS.Borders = {
    top:    { style: "thin", color: borderColor },
    left:   { style: "thin", color: borderColor },
    bottom: { style: "thin", color: borderColor },
    right:  { style: "thin", color: borderColor },
  };

  // Header row
  const hdr = ws.addRow(["Артикул", "Покупатель", "кол-во м2", "Цена за м2", "Стоимость"]);
  hdr.eachCell((cell) => {
    cell.font = font;
    cell.alignment = center;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF0C0" } } as ExcelJS.Fill;
    cell.border = thinBorder;
  });
  hdr.height = 16;

  const buyer = invoice.buyerLegalName || "";

  invoice.items.forEach((item, idx) => {
    const isM2 = item.priceUnit === PriceUnitEnum.M2;
    const totalM2 = item.quantityM2 ?? null;
    const priceRub = item.priceRub / 100;
    const totalRub = item.totalRub / 100;

    const row = ws.addRow([
      item.product.sku,
      idx === 0 ? buyer : "",
      isM2 && totalM2 !== null ? totalM2 : "",
      isM2 ? priceRub : "",
      totalRub,
    ]);

    row.height = 14;
    row.eachCell((c) => { c.font = font; c.alignment = center; c.border = thinBorder; });

    if (isM2 && totalM2 !== null) row.getCell(3).numFmt = "0.00##";
    if (isM2) row.getCell(4).numFmt = "#,##0.00";
    row.getCell(5).numFmt = "#,##0.00";
  });

  // Discount row (if any)
  if (invoice.discountPercent > 0) {
    const discountAmt = invoice.items.reduce((s, i) => s + i.totalRub, 0) * invoice.discountPercent / 100;
    const row = ws.addRow([`Скидка ${invoice.discountPercent}%`, "", "", "", -discountAmt / 100]);
    row.height = 14;
    row.eachCell((c) => { c.font = font; c.alignment = center; c.border = thinBorder; });
    row.getCell(5).numFmt = "#,##0.00";
  }

  // Delivery row (if any)
  if (invoice.deliveryPriceRub > 0) {
    const deliveryLabel = invoice.order?.deliveryMethod?.name ?? "Доставка";
    const row = ws.addRow([deliveryLabel, "", 1, invoice.deliveryPriceRub / 100, invoice.deliveryPriceRub / 100]);
    row.height = 14;
    row.eachCell((c) => { c.font = font; c.alignment = center; c.border = thinBorder; });
    row.getCell(4).numFmt = "#,##0.00";
    row.getCell(5).numFmt = "#,##0.00";
  }

  ws.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0, footer: 0 },
  };

  const buffer = await wb.xlsx.writeBuffer();
  const d = new Date(invoice.invoiceDate);
  const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }).replace(" г.", "");
  const orderPart = invoice.order ? `${invoice.order.sequenceNumber} (${invoice.sequenceNumber})` : String(invoice.sequenceNumber);
  const filename = `Бух запрос № ${orderPart} от ${dateStr} г.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
