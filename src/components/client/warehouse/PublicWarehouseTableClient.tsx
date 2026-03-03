"use client";

import { useState } from "react";
import { PublicWarehouseProductRow } from "./PublicWarehouseProductRow";
import { ProductGroup } from "@prisma/client";
import { ProductWithVariants } from "@/types/product/productWithVariants";

type ProductGroupWithProducts = ProductGroup & {
  products: ProductWithVariants[];
};

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

      {/* Sticky headers */}
      <div className="sticky top-0 bg-white z-10">
        {/* Group headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 text-xs text-slate-400">
          <div />
          <div className="col-span-2 text-center border-b border-slate-200 pb-1">
            На складе
          </div>
          <div className="col-span-2 text-center border-b border-slate-200 pb-1">
            Доступно
          </div>
          <div className="col-span-2 text-center border-b border-slate-200 pb-1">
            Зарезервировано
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 pb-2 text-sm text-slate-400 border-b">
          <div>Товар</div>
          <div className="text-center">листов</div>
          <div className="text-center">м²</div>
          <div className="text-center">листов</div>
          <div className="text-center">м²</div>
          <div className="text-center">листов</div>
          <div className="text-center">м²</div>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1 mt-2">
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 py-6">
            Товары не найдены
          </div>
        )}
        {filtered.map((group) => (
          <div key={group.id}>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-4 mb-1 px-3">
              {group.name}
            </div>
            <div className="flex flex-col gap-1">
              {group.products.map((product) => (
                <PublicWarehouseProductRow key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
