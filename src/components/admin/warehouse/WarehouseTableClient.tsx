"use client";

import { useState } from "react";
import { WarehouseProductRow } from "./WarehouseProductRow";
import { ProductGroupWithWarehouseData } from "@/types/product/productWithWarehouseData";

export function WarehouseTableClient({
  productGroups,
}: {
  productGroups: ProductGroupWithWarehouseData[];
}) {
  const [filter, setFilter] = useState("");

  const normalized = filter.trim().toLowerCase();

  const allProducts = productGroups.flatMap((g) => g.products);

  const totals = allProducts.reduce(
    (acc, product) => {
      const sheetArea = (product.length_mm * product.width_mm) / 1_000_000;
      for (const v of product.productVariants) {
        acc.warehouseQty += v.warehouseQuantity;
        acc.availableQty += v.availableQuantity;
        acc.warehouseArea += v.warehouseQuantity * sheetArea;
        acc.availableArea += v.availableQuantity * sheetArea;
      }
      return acc;
    },
    { warehouseQty: 0, availableQty: 0, warehouseArea: 0, availableArea: 0 },
  );

  const reservedQty = totals.warehouseQty - totals.availableQty;
  const reservedArea = totals.warehouseArea - totals.availableArea;

  const filtered = productGroups
    .map((group) => ({
      ...group,
      products: group.products.filter((p) =>
        p.sku.toLowerCase().includes(normalized),
      ),
    }))
    .filter((group) => group.products.length > 0);

  return (
    <>
      <input
        type="text"
        placeholder="Поиск по названию..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full md:w-80 mb-4 border border-slate-300 rounded-md py-1 px-2 focus:border-slate-500 focus:outline-none focus:ring-0"
      />

      {/* Sticky headers */}
      <div className="sticky top-0 bg-white z-10 hidden md:block">
        {/* Group headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_240px] gap-2 px-3 text-xs text-slate-400">
          <div />
          <div className="col-span-2 text-center border-b border-slate-200 pb-1">
            Доступно для заказа
          </div>
          <div className="col-span-2 text-center border-b border-slate-200 pb-1">
            На складе
          </div>
          <div className="col-span-2 text-center border-b border-slate-200 pb-1">
            В резерве
          </div>
          <div />
          <div />
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_240px] gap-2 px-3 pb-2 text-sm text-slate-400 border-b">
          <div>Товар</div>
          <div className="text-center">листов</div>
          <div className="text-center">м²</div>
          <div className="text-center">листов</div>
          <div className="text-center">м²</div>
          <div className="text-center">листов</div>
          <div className="text-center">м²</div>
          <div className="text-center">Активные резервы</div>
          <div />
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1 mt-2 mb-16 md:mb-0">
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 py-6">
            Товары не найдены
          </div>
        )}
        {filtered.map((group) => (
          <div key={group.id}>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-6 mb-0 px-3">
              {group.name}
            </div>
            <div className="flex flex-col gap-1">
              {group.products.map((product) => (
                <WarehouseProductRow key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer totals */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_240px] gap-2 py-2 px-3 mt-16 border-t font-medium text-slate-400">
        <div>Итого</div>
        <div className="text-center">{totals.availableQty}</div>
        <div className="text-center">{totals.availableArea.toFixed(2)}</div>
        <div className="text-center">{totals.warehouseQty}</div>
        <div className="text-center">{totals.warehouseArea.toFixed(2)}</div>
        <div className="text-center">{reservedQty}</div>
        <div className="text-center">{reservedArea.toFixed(2)}</div>
        <div />
        <div />
      </div>
    </>
  );
}
