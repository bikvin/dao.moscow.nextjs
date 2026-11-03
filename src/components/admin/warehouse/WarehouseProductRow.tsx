import { Fragment } from "react";
import Link from "next/link";
import { ProductWithWarehouseData } from "@/types/product/productWithWarehouseData";

function area(quantity: number, length_mm: number, width_mm: number): string {
  return ((quantity * length_mm * width_mm) / 1_000_000).toFixed(2);
}

export function WarehouseProductRow({
  product,
  index,
}: {
  product: ProductWithWarehouseData;
  index: number;
}) {
  const variants = product.productVariants;
  const multiVariant = variants.length > 1;

  const totalWarehouse = variants.reduce((s, v) => s + v.warehouseQuantity, 0);
  const totalAvailable = variants.reduce((s, v) => s + v.availableQuantity, 0);

  const allActiveReserves = variants.flatMap((v) => v.productReserves);

  const actionButtons = (
    <>
      <Link
        href={`/admin/products/product-reserves/create?productId=${product.id}`}
        className="text-xs text-sky-800 bg-sky-100 hover:bg-sky-200 rounded px-2 py-0.5 whitespace-nowrap"
      >
        + Резерв
      </Link>
      <Link
        href={`/admin/products/product-issues/create?productId=${product.id}`}
        className="text-xs text-rose-800 bg-rose-100 hover:bg-rose-200 rounded px-2 py-0.5 whitespace-nowrap"
      >
        + Списание
      </Link>
      <Link
        href={`/admin/products/product-receipts/create?productId=${product.id}`}
        className="text-xs text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded px-2 py-0.5 whitespace-nowrap"
      >
        + Приход
      </Link>
    </>
  );

  return (
    <div className="relative border-b border-slate-200 hover:bg-slate-100">
      {/* Mobile card */}
      <div className="md:hidden flex flex-col gap-1 py-2 px-3 text-sm mt-4">
        <div className="font-bold"><span className="text-slate-400 font-normal text-xs mr-1">{index}.</span>{product.sku}</div>

        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 mt-1">
          <span />
          <span className="text-slate-400 text-xs text-center">листов</span>
          <span className="text-slate-400 text-xs text-center">м²</span>

          <span className="text-slate-600 font-medium pt-1">Доступно для заказа</span>
          <span className="text-green-700 font-semibold text-center pt-1">{totalAvailable}</span>
          <span className="text-green-700 font-semibold text-center pt-1">{area(totalAvailable, product.length_mm, product.width_mm)}</span>
          {multiVariant && variants.map((v) => (
            <Fragment key={v.id}>
              <span className="text-slate-400 pl-3">{v.variantName}</span>
              <span className="text-green-700 text-center">{v.availableQuantity}</span>
              <span className="text-green-700 text-center">{area(v.availableQuantity, product.length_mm, product.width_mm)}</span>
            </Fragment>
          ))}

          <span className="text-slate-400 text-xs pt-2">Всего на складе</span>
          <span className="text-slate-400 text-xs text-center pt-2">{totalWarehouse}</span>
          <span className="text-slate-400 text-xs text-center pt-2">{area(totalWarehouse, product.length_mm, product.width_mm)}</span>
          {multiVariant && variants.map((v) => (
            <Fragment key={v.id}>
              <span className="text-slate-400 text-xs pl-3">{v.variantName}</span>
              <span className="text-slate-400 text-xs text-center">{v.warehouseQuantity}</span>
              <span className="text-slate-400 text-xs text-center">{area(v.warehouseQuantity, product.length_mm, product.width_mm)}</span>
            </Fragment>
          ))}
        </div>

        {allActiveReserves.length > 0 && (
          <div className="mt-2 space-y-0.5">
            <span className="text-slate-400">Активные резервы</span>
            {allActiveReserves.map((r) => (
              <Link
                key={r.id}
                href={`/admin/products/product-reserves/update/${r.id}`}
                className="block text-slate-600 hover:underline hover:text-blue-600"
              >
                {r.client} — {r.quantity} шт.
              </Link>
            ))}
          </div>
        )}
        <div className="flex flex-row gap-1 mt-3">{actionButtons}</div>
      </div>

      {/* Desktop row */}
      <div className="hidden md:flex gap-2 px-3 font-medium items-center">
        <div className="flex-[3] min-w-0 py-2">
          <span className="text-slate-400 font-normal text-xs mr-1">{index}.</span>{product.sku}
        </div>
        <div className="flex-[2] self-stretch flex items-center">
          <div className="flex-1 text-center text-green-700 text-base font-semibold py-2">
            {totalAvailable}<span className="text-xs text-slate-400 font-normal ml-0.5">шт.</span>
          </div>

          <div className="flex-1 text-center text-green-700 text-base font-semibold py-2">
            {area(totalAvailable, product.length_mm, product.width_mm)}<span className="text-xs text-slate-400 font-normal ml-0.5">м²</span>
          </div>
        </div>
        <div className="flex-[2] flex items-center py-2">
          <div className="flex-1 text-center text-slate-400 text-sm font-normal">
            {totalWarehouse}<span className="text-xs ml-0.5">шт.</span>
          </div>

          <div className="flex-1 text-center text-slate-400 text-sm font-normal">
            {area(totalWarehouse, product.length_mm, product.width_mm)}<span className="text-xs ml-0.5">м²</span>
          </div>
        </div>
        <div className="flex-[2] text-sm font-normal space-y-0.5 py-2">
          {allActiveReserves.map((r) => (
            <Link
              key={r.id}
              href={`/admin/products/product-reserves/update/${r.id}`}
              className="block text-slate-600 hover:underline hover:text-blue-600"
            >
              {r.client} — {r.quantity} шт.
            </Link>
          ))}
        </div>
        <div className="w-[240px] flex flex-row gap-1 py-2">{actionButtons}</div>
      </div>

      {/* Variant rows */}
      {multiVariant &&
        variants.map((variant) => (
          <div key={variant.id} className="hidden md:flex gap-2 px-3 pl-8 text-sm text-slate-600 items-center">
            <div className="flex-[3] min-w-0 py-1">{variant.variantName}</div>
            <div className="flex-[2] self-stretch flex items-center">
              <div className="flex-1 text-center text-green-600 font-medium py-1">
                {variant.availableQuantity}<span className="text-xs text-slate-400 font-normal ml-0.5">шт.</span>
              </div>
    
              <div className="flex-1 text-center text-green-600 font-medium py-1">
                {area(variant.availableQuantity, product.length_mm, product.width_mm)}<span className="text-xs text-slate-400 font-normal ml-0.5">м²</span>
              </div>
            </div>
            <div className="flex-[2] flex items-center py-1">
              <div className="flex-1 text-center text-slate-400">
                {variant.warehouseQuantity}<span className="text-xs ml-0.5">шт.</span>
              </div>
    
              <div className="flex-1 text-center text-slate-400">
                {area(variant.warehouseQuantity, product.length_mm, product.width_mm)}<span className="text-xs ml-0.5">м²</span>
              </div>
            </div>
            <div className="flex-[2] space-y-0.5 py-1">
              {variant.productReserves.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/products/product-reserves/update/${r.id}`}
                  className="block text-slate-500 hover:underline hover:text-blue-600"
                >
                  {r.client} — {r.quantity} шт.
                </Link>
              ))}
            </div>
            <div className="w-[240px]" />
          </div>
        ))}
    </div>
  );
}
