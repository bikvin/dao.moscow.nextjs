"use server";

import { db } from "@/db";
import { CurrencyEnum, PriceUnitEnum } from "@prisma/client";
import * as XLSX from "xlsx";

export type UploadReceiptPricesState = {
  errors?: { _form?: string[] };
  success?: { updated: number; skipped: number; message: string };
};

const VALID_CURRENCIES = new Set<string>(Object.values(CurrencyEnum));
const VALID_UNITS = new Set<string>(Object.values(PriceUnitEnum));

// Parses an uploaded Excel file and bulk-sets price/priceCurrency/priceUnit on all
// ProductReceipt records matching each SKU row. Rows with missing or invalid data are skipped.
export async function uploadReceiptPrices(
  _state: UploadReceiptPricesState,
  formData: FormData,
): Promise<UploadReceiptPricesState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { errors: { _form: ["Выберите файл"] } };
  }

  let rows: Record<string, unknown>[];
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  } catch {
    return { errors: { _form: ["Не удалось прочитать файл. Убедитесь, что это корректный Excel-файл."] } };
  }

  if (rows.length === 0) {
    return { errors: { _form: ["Файл не содержит данных"] } };
  }

  // Parse and validate all rows first, collecting valid entries keyed by SKU
  type ValidRow = { price: number; priceCurrency: CurrencyEnum; priceUnit: PriceUnitEnum };
  const validBySku = new Map<string, ValidRow>();
  let skipped = 0;

  for (const row of rows) {
    const sku = String(row["sku"] ?? "").trim();
    const priceRaw = row["price"];
    const currencyRaw = String(row["priceCurrency (RUB/USD/RMB)"] ?? row["priceCurrency"] ?? "").trim().toUpperCase();
    const unitRaw = String(row["priceUnit (ITEM/M2)"] ?? row["priceUnit"] ?? "").trim().toUpperCase();

    if (!sku || priceRaw === undefined || priceRaw === "") { skipped++; continue; }

    const price = typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw));
    if (isNaN(price) || price <= 0) { skipped++; continue; }
    if (!VALID_CURRENCIES.has(currencyRaw)) { skipped++; continue; }
    if (!VALID_UNITS.has(unitRaw)) { skipped++; continue; }

    validBySku.set(sku, {
      price,
      priceCurrency: currencyRaw as CurrencyEnum,
      priceUnit: unitRaw as PriceUnitEnum,
    });
  }

  skipped += rows.length - skipped - validBySku.size;

  if (validBySku.size === 0) {
    return { errors: { _form: ["Нет корректных строк для обновления"] } };
  }

  // Single query: fetch all products + variants for the valid SKUs
  const products = await db.product.findMany({
    where: { sku: { in: [...validBySku.keys()] } },
    select: { sku: true, productVariants: { select: { id: true } } },
  });

  // Build map: variantId -> ValidRow
  const pricingByVariantId = new Map<string, ValidRow>();
  for (const product of products) {
    const pricing = validBySku.get(product.sku);
    if (!pricing) continue;
    for (const variant of product.productVariants) {
      pricingByVariantId.set(variant.id, pricing);
    }
  }

  // Single query: fetch all receipts for those variants
  const receipts = await db.productReceipt.findMany({
    where: { productVariantId: { in: [...pricingByVariantId.keys()] } },
    select: { id: true, productVariantId: true },
  });

  if (receipts.length === 0) {
    return { success: { updated: 0, skipped, message: `Обновлено записей: 0. Пропущено строк: ${skipped}.` } };
  }

  // Group receipt IDs by their (price, currency, unit) combination to minimise updateMany calls
  type GroupKey = string;
  const groups = new Map<GroupKey, { ids: string[]; data: ValidRow }>();
  for (const receipt of receipts) {
    const pricing = pricingByVariantId.get(receipt.productVariantId);
    if (!pricing) continue;
    const key = `${pricing.price}|${pricing.priceCurrency}|${pricing.priceUnit}`;
    if (!groups.has(key)) groups.set(key, { ids: [], data: pricing });
    groups.get(key)!.ids.push(receipt.id);
  }

  // Execute one updateMany per unique pricing combination
  await Promise.all(
    [...groups.values()].map(({ ids, data }) =>
      db.productReceipt.updateMany({
        where: { id: { in: ids } },
        data: { price: data.price, priceCurrency: data.priceCurrency, priceUnit: data.priceUnit },
      })
    )
  );

  const updated = receipts.length;

  return {
    success: {
      updated,
      skipped,
      message: `Обновлено записей: ${updated}. Пропущено строк: ${skipped}.`,
    },
  };
}
