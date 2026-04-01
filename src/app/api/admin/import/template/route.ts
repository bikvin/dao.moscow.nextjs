import { db } from "@/db";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await db.product.findMany({
    orderBy: [{ productGroup: { displayOrder: "asc" } }, { displayOrder: "asc" }, { sku: "asc" }],
    include: { prices: true, chipSize: true },
  });

  const rows = products.map((p) => {
    const dealer = p.prices.find((pr) => pr.type === "DEALER");
    const retail = p.prices.find((pr) => pr.type === "RETAIL");
    return {
      SKU: p.sku,
      "Размер чипа": p.chipSize?.name ?? "",
      "Дилерская цена": dealer ? dealer.priceInCents / 100 : "",
      "Дилерская валюта (USD/RUB)": dealer?.currency ?? "USD",
      "Дилерская единица (M2/ITEM)": dealer?.unit ?? "M2",
      "Дилерское кол-во шт": dealer?.quantity ?? 1,
      "Розничная цена": retail ? retail.priceInCents / 100 : "",
      "Розничная валюта (USD/RUB)": retail?.currency ?? "USD",
      "Розничная единица (M2/ITEM)": retail?.unit ?? "M2",
      "Розничное кол-во шт": retail?.quantity ?? 1,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 30 }, // SKU
    { wch: 16 }, // Chip size
    { wch: 18 }, // Dealer price
    { wch: 24 }, // Dealer currency
    { wch: 26 }, // Dealer unit
    { wch: 22 }, // Dealer qty
    { wch: 18 }, // Retail price
    { wch: 24 }, // Retail currency
    { wch: 26 }, // Retail unit
    { wch: 22 }, // Retail qty
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Прайс-лист");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="price-import-template.xlsx"',
    },
  });
}
