import { db } from "@/db";
import * as XLSX from "xlsx";

// Generates and returns an Excel template with one row per product SKU.
// Columns: sku (filled), price (empty), priceCurrency (empty), priceUnit (empty).
export async function GET() {
  const products = await db.product.findMany({
    select: { sku: true },
    orderBy: { sku: "asc" },
  });

  const rows: (string | number)[][] = [
    ["sku", "price", "priceCurrency (RUB/USD/RMB)", "priceUnit (ITEM/M2)"],
    ...products.map((p) => [p.sku, "", "", ""]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 24 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Цены закупки");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Uint8Array;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="receipt-prices-template.xlsx"',
    },
  });
}
