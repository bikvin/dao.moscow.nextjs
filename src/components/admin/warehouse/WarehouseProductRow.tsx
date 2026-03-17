import Link from "next/link";
import { ProductWithWarehouseData } from "@/types/product/productWithWarehouseData";

function area(quantity: number, length_mm: number, width_mm: number): string {
  return ((quantity * length_mm * width_mm) / 1_000_000).toFixed(2);
}

export function WarehouseProductRow({
  product,
}: {
  product: ProductWithWarehouseData;
}) {
  const variants = product.productVariants;
  const multiVariant = variants.length > 1;

  const totalWarehouse = variants.reduce((s, v) => s + v.warehouseQuantity, 0);
  const totalAvailable = variants.reduce((s, v) => s + v.availableQuantity, 0);
  const totalReserved = totalWarehouse - totalAvailable;

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
    <div>
      {/* Mobile card */}
      <div className="md:hidden flex flex-col gap-1 py-2 px-3 rounded-md bg-slate-100 text-sm mt-4">
        <div className="font-bold">{product.sku}</div>

        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 mt-1">
          <span />
          <span className="text-slate-400 text-xs text-center">листов</span>
          <span className="text-slate-400 text-xs text-center">м²</span>

          <span className="text-slate-400 pt-1">Доступно для заказа</span>
          <span className="text-green-700 text-center pt-1">{totalAvailable}</span>
          <span className="text-green-700 text-center pt-1">{area(totalAvailable, product.length_mm, product.width_mm)}</span>
          {multiVariant && variants.map((v) => (
            <>
              <span className="text-slate-400 pl-3">{v.variantName}</span>
              <span className="text-green-700 text-center">{v.availableQuantity}</span>
              <span className="text-green-700 text-center">{area(v.availableQuantity, product.length_mm, product.width_mm)}</span>
            </>
          ))}

          <span className="text-slate-400 pt-2">На складе</span>
          <span className="text-center pt-2">{totalWarehouse}</span>
          <span className="text-center pt-2">{area(totalWarehouse, product.length_mm, product.width_mm)}</span>
          {multiVariant && variants.map((v) => (
            <>
              <span className="text-slate-400 pl-3">{v.variantName}</span>
              <span className="text-center">{v.warehouseQuantity}</span>
              <span className="text-center">{area(v.warehouseQuantity, product.length_mm, product.width_mm)}</span>
            </>
          ))}

          <span className="text-slate-400 pt-2">В резерве</span>
          <span className="text-amber-600 text-center pt-2">{totalReserved}</span>
          <span className="text-amber-600 text-center pt-2">{area(totalReserved, product.length_mm, product.width_mm)}</span>
          {multiVariant && variants.map((v) => {
            const reserved = v.warehouseQuantity - v.availableQuantity;
            return (
              <>
                <span className="text-slate-400 pl-3">{v.variantName}</span>
                <span className="text-amber-600 text-center">{reserved}</span>
                <span className="text-amber-600 text-center">{area(reserved, product.length_mm, product.width_mm)}</span>
              </>
            );
          })}
        </div>

        {allActiveReserves.length > 0 && (
          <div className="mt-1 space-y-0.5">
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
        <div className="flex flex-row gap-1 mt-1">{actionButtons}</div>
      </div>

      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_240px] gap-2 py-2 px-3 rounded-md bg-slate-100 font-medium items-center">
        <div>{product.sku}</div>
        <div className="text-center text-green-700">{totalAvailable}</div>
        <div className="text-center text-green-700">
          {area(totalAvailable, product.length_mm, product.width_mm)}
        </div>
        <div className="text-center">{totalWarehouse}</div>
        <div className="text-center">
          {area(totalWarehouse, product.length_mm, product.width_mm)}
        </div>
        <div className="text-center text-amber-600">{totalReserved}</div>
        <div className="text-center text-amber-600">
          {area(totalReserved, product.length_mm, product.width_mm)}
        </div>
        <div className="text-sm font-normal space-y-0.5">
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
        <div className="flex flex-row gap-1">{actionButtons}</div>
      </div>

      {/* Variant rows */}
      {multiVariant &&
        variants.map((variant) => {
          const reserved =
            variant.warehouseQuantity - variant.availableQuantity;
          return (
            <div
              key={variant.id}
              className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_240px] gap-2 py-1 px-3 pl-8 text-sm text-slate-600 items-center"
            >
              <div>{variant.variantName}</div>
              <div className="text-center text-green-600">
                {variant.availableQuantity}
              </div>
              <div className="text-center text-green-600">
                {area(
                  variant.availableQuantity,
                  product.length_mm,
                  product.width_mm,
                )}
              </div>
              <div className="text-center">{variant.warehouseQuantity}</div>
              <div className="text-center">
                {area(
                  variant.warehouseQuantity,
                  product.length_mm,
                  product.width_mm,
                )}
              </div>
              <div className="text-center text-amber-500">{reserved}</div>
              <div className="text-center text-amber-500">
                {area(reserved, product.length_mm, product.width_mm)}
              </div>
              <div className="space-y-0.5">
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
              <div />
            </div>
          );
        })}
    </div>
  );
}
