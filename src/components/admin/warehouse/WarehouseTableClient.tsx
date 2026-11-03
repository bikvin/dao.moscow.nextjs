"use client";

import { useState } from "react";
import { WarehouseProductRow } from "./WarehouseProductRow";
import { ProductGroupWithWarehouseData } from "@/types/product/productWithWarehouseData";

// Position/width of the "Доступно для заказа" column stripe.
// Row layout: px-3(12) | flex-[3] | gap-2(8) | flex-[2] stripe | gap-2(8) | flex-[2] | gap-2(8) | flex-[2] | gap-2(8) | w-[240px]
// Total non-fr: 2×12 + 4×8 + 240 = 296px → each fr = (100% - 296px) / 9
const stripeStyle: React.CSSProperties = {
  left:  "calc(12px + (100% - 296px) / 3)",
  width: "calc((100% - 296px) * 2 / 9 + 16px)",
};

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

      {/* Sticky headers — stripe div inside keeps it aligned when scrolling */}
      <div className="sticky top-0 z-10 hidden md:block relative">
        <div className="absolute inset-y-0 bg-slate-100 pointer-events-none" style={stripeStyle} />

        {/* Group labels */}
        <div className="relative flex gap-2 px-3 pt-2 pb-2 text-xs border-b">
          <div className="flex-[3] min-w-0 bg-white" />
          <div className="flex-[2] text-center text-slate-600 font-semibold">
            Доступно для заказа
          </div>
          <div className="flex-[2] text-center text-slate-400 bg-white">
            Всего на складе
          </div>
          <div className="flex-[2] text-center text-slate-400 bg-white">Активные резервы</div>
          <div className="w-[240px] bg-white" />
        </div>

      </div>

      {/* Rows */}
      <div className="relative flex flex-col mb-16 md:mb-0">
        <div className="absolute inset-y-0 bg-slate-100 hidden md:block pointer-events-none" style={stripeStyle} />
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 py-6">
            Товары не найдены
          </div>
        )}
        {(() => {
          let counter = 0;
          return filtered.map((group) => (
            <div key={group.id}>
              <div className="relative text-sm font-semibold text-slate-500 uppercase tracking-widest mt-6 mb-0 px-3">
                {group.name}
              </div>
              <div className="flex flex-col">
                {group.products.map((product) => (
                  <WarehouseProductRow key={product.id} product={product} index={++counter} />
                ))}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Footer totals */}
      <div className="hidden md:flex gap-2 py-2 px-3 mt-16 border-t font-medium items-center">
        <div className="flex-[3] min-w-0 text-slate-400">Итого</div>
        <div className="flex-[2] self-stretch flex items-center">
          <div className="flex-1 text-center text-slate-600">{totals.availableQty}</div>
          <div className="flex-1 text-center text-slate-600">{totals.availableArea.toFixed(2)}</div>
        </div>
        <div className="flex-[2] flex items-center">
          <div className="flex-1 text-center text-slate-300">{totals.warehouseQty}</div>
          <div className="flex-1 text-center text-slate-300">{totals.warehouseArea.toFixed(2)}</div>
        </div>
        <div className="flex-[2]" />
        <div className="w-[240px]" />
      </div>
    </>
  );
}
