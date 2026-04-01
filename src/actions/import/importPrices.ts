"use server";

import { db } from "@/db";
import * as XLSX from "xlsx";
import { CurrencyEnum, PriceTypeEnum, PriceUnitEnum } from "@prisma/client";

export interface ImportResult {
  errors: {
    _form?: string[];
  };
  result?: {
    updated: number;
    skipped: string[];
  };
}

export async function importPrices(
  _prev: ImportResult,
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { errors: { _form: ["Выберите файл для загрузки"] } };
  }

  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    if (rows.length === 0) {
      return { errors: { _form: ["Файл пуст"] } };
    }

    // 1. Collect all SKUs and chip size names from the file
    const skus = [...new Set(rows.map((r) => String(r["SKU"] ?? "").trim()).filter(Boolean))];
    const chipSizeNames = [...new Set(rows.map((r) => String(r["Размер чипа"] ?? "").trim()).filter(Boolean))];

    // 2. Fetch all needed products and chip sizes in 2 queries
    const [products, existingChipSizes] = await Promise.all([
      db.product.findMany({ where: { sku: { in: skus } }, select: { id: true, sku: true, chipSizeId: true } }),
      db.chipSize.findMany({ where: { name: { in: chipSizeNames } }, select: { id: true, name: true } }),
    ]);

    const productMap = new Map(products.map((p) => [p.sku, p]));
    const chipSizeMap = new Map(existingChipSizes.map((c) => [c.name, c.id]));

    // 3. Create any missing chip sizes
    const missingChipSizeNames = chipSizeNames.filter((n) => !chipSizeMap.has(n));
    if (missingChipSizeNames.length > 0) {
      await db.chipSize.createMany({ data: missingChipSizeNames.map((name) => ({ name })), skipDuplicates: true });
      const newChipSizes = await db.chipSize.findMany({ where: { name: { in: missingChipSizeNames } }, select: { id: true, name: true } });
      for (const cs of newChipSizes) chipSizeMap.set(cs.name, cs.id);
    }

    // 4. Build all upsert operations
    const skipped: string[] = [];
    const priceUpserts: Promise<unknown>[] = [];
    const productUpdates: Promise<unknown>[] = [];
    let updated = 0;

    for (const row of rows) {
      const sku = String(row["SKU"] ?? "").trim();
      if (!sku) continue;

      const product = productMap.get(sku);
      if (!product) {
        skipped.push(sku);
        continue;
      }

      // Chip size update
      const chipSizeName = String(row["Размер чипа"] ?? "").trim();
      const newChipSizeId = chipSizeName ? (chipSizeMap.get(chipSizeName) ?? null) : product.chipSizeId;
      if (newChipSizeId !== product.chipSizeId) {
        productUpdates.push(db.product.update({ where: { id: product.id }, data: { chipSizeId: newChipSizeId } }));
      }

      // Dealer price
      const dealerPrice = Number(row["Дилерская цена"]);
      const dealerCurrency = String(row["Дилерская валюта (USD/RUB)"] ?? "USD").trim() as CurrencyEnum;
      const dealerUnit = String(row["Дилерская единица (M2/ITEM)"] ?? "M2").trim() as PriceUnitEnum;
      const dealerQty = Math.max(1, Number(row["Дилерское кол-во шт"] ?? 1));

      if (dealerPrice > 0 && ["USD", "RUB"].includes(dealerCurrency) && ["M2", "ITEM"].includes(dealerUnit)) {
        const dealerData = { priceInCents: Math.round(dealerPrice * 100), currency: dealerCurrency, unit: dealerUnit, quantity: dealerUnit === "ITEM" ? dealerQty : 1 };
        priceUpserts.push(db.price.upsert({
          where: { productId_type: { productId: product.id, type: PriceTypeEnum.DEALER } },
          update: dealerData,
          create: { productId: product.id, type: PriceTypeEnum.DEALER, ...dealerData },
        }));
      }

      // Retail price
      const retailPrice = Number(row["Розничная цена"]);
      const retailCurrency = String(row["Розничная валюта (USD/RUB)"] ?? "USD").trim() as CurrencyEnum;
      const retailUnit = String(row["Розничная единица (M2/ITEM)"] ?? "M2").trim() as PriceUnitEnum;
      const retailQty = Math.max(1, Number(row["Розничное кол-во шт"] ?? 1));

      if (retailPrice > 0 && ["USD", "RUB"].includes(retailCurrency) && ["M2", "ITEM"].includes(retailUnit)) {
        const retailData = { priceInCents: Math.round(retailPrice * 100), currency: retailCurrency, unit: retailUnit, quantity: retailUnit === "ITEM" ? retailQty : 1 };
        priceUpserts.push(db.price.upsert({
          where: { productId_type: { productId: product.id, type: PriceTypeEnum.RETAIL } },
          update: retailData,
          create: { productId: product.id, type: PriceTypeEnum.RETAIL, ...retailData },
        }));
      }

      updated++;
    }

    // 5. Run all writes in parallel
    await Promise.all([...productUpdates, ...priceUpserts]);

    return { errors: {}, result: { updated, skipped } };
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Ошибка при обработке файла"] } };
  }
}
