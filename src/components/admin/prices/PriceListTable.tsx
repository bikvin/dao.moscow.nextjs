"use client";

import { useState } from "react";
import { ChipSize, Price, PriceTypeEnum, PriceUnitEnum, Product, ProductGroup } from "@prisma/client";

type ProductWithPrices = Product & { prices: Price[]; chipSize: ChipSize | null };
type ProductGroupWithPrices = ProductGroup & { products: ProductWithPrices[] };

function unitLabel(unit: PriceUnitEnum, quantity: number): string {
  if (unit === PriceUnitEnum.M2) return "м²";
  return quantity > 1 ? `${quantity} шт` : "шт";
}

function formatUsd(priceInCents: number): string {
  return Math.round(priceInCents / 100).toLocaleString("ru-RU");
}

function formatRub(priceInCents: number): string {
  return Math.round(priceInCents / 100).toLocaleString("ru-RU");
}

function PriceCell({
  price,
  mainRate,
}: {
  price: Price | undefined;
  mainRate: number | null;
}) {
  if (!price) return <div className="text-center text-slate-300">—</div>;

  const unit = unitLabel(price.unit, price.quantity);
  const isUsd = price.currency === "USD";

  const isNonStandardUnit = price.unit !== PriceUnitEnum.M2;
  const usdDisplay = isUsd ? `$${formatUsd(price.priceInCents)}` : null;
  const rubDisplay =
    price.currency === "RUB"
      ? `${formatRub(price.priceInCents)} ₽`
      : mainRate !== null
        ? `${formatRub(price.priceInCents * mainRate)} ₽`
        : null;

  return (
    <div className="text-center text-sm">
      {(usdDisplay || rubDisplay) ? (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {usdDisplay && (
            <span className="font-medium">
              {usdDisplay}{isNonStandardUnit && <span className="text-slate-400 text-xs"> / {unit}</span>}
            </span>
          )}
          {rubDisplay && (
            <span className={usdDisplay ? "text-slate-500" : "font-medium"}>
              {usdDisplay ? "(" : ""}{rubDisplay}{isNonStandardUnit && <span className="text-slate-400 text-xs"> / {unit}</span>}{usdDisplay ? ")" : ""}
            </span>
          )}
        </div>
      ) : (
        <span className="text-slate-300">—</span>
      )}
    </div>
  );
}

export function PriceListTable({
  productGroups,
  mainRate,
}: {
  productGroups: ProductGroupWithPrices[];
  mainRate: number | null;
}) {
  const [filter, setFilter] = useState("");
  const normalized = filter.trim().toLowerCase();

  const filtered = productGroups
    .map((group) => ({
      ...group,
      products: group.products.filter((p) =>
        p.sku.toLowerCase().includes(normalized)
      ),
    }))
    .filter((group) => group.products.length > 0);

  const cols = "grid-cols-[2fr_120px_80px_80px_1fr_1fr]";

  return (
    <>
      <input
        type="text"
        placeholder="Поиск по названию..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full md:w-80 mb-4 border border-slate-300 rounded-md py-1 px-2 focus:border-slate-500 focus:outline-none focus:ring-0"
      />

      {/* Header */}
      <div className={`sticky top-0 bg-white z-10`}>
        <div className={`grid ${cols} gap-6 px-3 text-xs text-slate-400 border-b pb-2`}>
          <div>Товар</div>
          <div className="text-center">Размер сетки</div>
          <div className="text-center">Толщина</div>
          <div className="text-center">Чип</div>
          <div className="text-center">Дилерская цена / м²</div>
          <div className="text-center">Розничная цена / м²</div>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1 mt-2 mb-16 md:mb-0">
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 py-6">Товары не найдены</div>
        )}
        {filtered.map((group) => (
          <div key={group.id}>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-6 mb-1 px-3">
              {group.name}
            </div>
            <div className="flex flex-col gap-1">
            {group.products.map((product) => {
              const dealer = product.prices.find((p) => p.type === PriceTypeEnum.DEALER);
              const retail = product.prices.find((p) => p.type === PriceTypeEnum.RETAIL);
              return (
                <div
                  key={product.id}
                  className={`grid ${cols} gap-6 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors items-center`}
                >
                  <div className="text-sm font-medium">{product.sku}</div>
                  <div className="text-center text-sm text-slate-500">{product.width_mm}×{product.length_mm}мм</div>
                  <div className="text-center text-sm text-slate-500">{product.thickness_mm} мм</div>
                  <div className="text-center text-sm text-slate-500">{product.chipSize?.name ?? "—"}</div>
                  <PriceCell price={dealer} mainRate={mainRate} />
                  <PriceCell price={retail} mainRate={mainRate} />
                </div>
              );
            })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
