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

    let updated = 0;
    const skipped: string[] = [];

    for (const row of rows) {
      const sku = String(row["SKU"] ?? "").trim();
      if (!sku) continue;

      const product = await db.product.findFirst({ where: { sku } });
      if (!product) {
        skipped.push(sku);
        continue;
      }

      // Handle chip size
      const chipSizeName = String(row["Размер чипа"] ?? "").trim();
      let chipSizeId: string | null = product.chipSizeId;
      if (chipSizeName) {
        const chipSize = await db.chipSize.upsert({
          where: { name: chipSizeName },
          update: {},
          create: { name: chipSizeName },
        });
        chipSizeId = chipSize.id;
      }

      if (chipSizeId !== product.chipSizeId) {
        await db.product.update({ where: { id: product.id }, data: { chipSizeId } });
      }

      // Handle dealer price
      const dealerPrice = Number(row["Дилерская цена"]);
      const dealerCurrency = String(row["Дилерская валюта (USD/RUB)"] ?? "USD").trim() as CurrencyEnum;
      const dealerUnit = String(row["Дилерская единица (M2/ITEM)"] ?? "M2").trim() as PriceUnitEnum;
      const dealerQty = Math.max(1, Number(row["Дилерское кол-во шт"] ?? 1));

      if (dealerPrice > 0 && ["USD", "RUB"].includes(dealerCurrency) && ["M2", "ITEM"].includes(dealerUnit)) {
        await db.price.upsert({
          where: { productId_type: { productId: product.id, type: PriceTypeEnum.DEALER } },
          update: { priceInCents: Math.round(dealerPrice * 100), currency: dealerCurrency, unit: dealerUnit, quantity: dealerUnit === "ITEM" ? dealerQty : 1 },
          create: { productId: product.id, type: PriceTypeEnum.DEALER, priceInCents: Math.round(dealerPrice * 100), currency: dealerCurrency, unit: dealerUnit, quantity: dealerUnit === "ITEM" ? dealerQty : 1 },
        });
      }

      // Handle retail price
      const retailPrice = Number(row["Розничная цена"]);
      const retailCurrency = String(row["Розничная валюта (USD/RUB)"] ?? "USD").trim() as CurrencyEnum;
      const retailUnit = String(row["Розничная единица (M2/ITEM)"] ?? "M2").trim() as PriceUnitEnum;
      const retailQty = Math.max(1, Number(row["Розничное кол-во шт"] ?? 1));

      if (retailPrice > 0 && ["USD", "RUB"].includes(retailCurrency) && ["M2", "ITEM"].includes(retailUnit)) {
        await db.price.upsert({
          where: { productId_type: { productId: product.id, type: PriceTypeEnum.RETAIL } },
          update: { priceInCents: Math.round(retailPrice * 100), currency: retailCurrency, unit: retailUnit, quantity: retailUnit === "ITEM" ? retailQty : 1 },
          create: { productId: product.id, type: PriceTypeEnum.RETAIL, priceInCents: Math.round(retailPrice * 100), currency: retailCurrency, unit: retailUnit, quantity: retailUnit === "ITEM" ? retailQty : 1 },
        });
      }

      updated++;
    }

    return { errors: {}, result: { updated, skipped } };
  } catch (err) {
    return { errors: { _form: [err instanceof Error ? err.message : "Ошибка при обработке файла"] } };
  }
}
