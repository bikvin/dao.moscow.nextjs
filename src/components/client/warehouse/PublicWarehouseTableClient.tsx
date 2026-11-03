"use client";

import { useState } from "react";
import { PublicWarehouseProductRow } from "./PublicWarehouseProductRow";
import { ProductGroup } from "@prisma/client";
import { ProductWithVariants } from "@/types/product/productWithVariants";

type ProductGroupWithProducts = ProductGroup & {
  products: ProductWithVariants[];
};

// Position/width of the "Доступно для заказа" column stripe.
// Row layout: px-3(12) | flex-[3] | gap-2(8) | flex-[2] stripe | gap-2(8) | flex-[2]
// Total non-fr: 2×12 + 2×8 = 40px → each fr = (100% - 40px) / 7
const stripeStyle: React.CSSProperties = {
  left:  "calc(12px + (100% - 40px) * 3 / 7)",
  width: "calc((100% - 40px) * 2 / 7 + 16px)",
};

// Client component for the public warehouse table with search filtering.
export function PublicWarehouseTableClient({
  productGroups,
}: {
  productGroups: ProductGroupWithProducts[];
}) {
  const [filter, setFilter] = useState("");

  const normalized = filter.trim().toLowerCase();

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
      <div className="sticky top-0 z-10 hidden md:block">
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
        </div>
      </div>

      {/* Rows */}
      <div className="relative flex flex-col mb-4">
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
                  <PublicWarehouseProductRow key={product.id} product={product} index={++counter} />
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    </>
  );
}
