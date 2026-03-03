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

  return (
    <div>
      {/* Product row */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_80px] gap-2 py-2 px-3 rounded-md bg-slate-100 font-medium items-center">
        <div>{product.sku}</div>
        <div className="text-center">{totalWarehouse}</div>
        <div className="text-center">
          {area(totalWarehouse, product.length_mm, product.width_mm)}
        </div>
        <div className="text-center text-green-700">{totalAvailable}</div>
        <div className="text-center text-green-700">
          {area(totalAvailable, product.length_mm, product.width_mm)}
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
        <div className="flex flex-col md:flex-row gap-1">
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
        </div>
      </div>

      {/* Variant rows */}
      {multiVariant &&
        variants.map((variant) => {
          const reserved =
            variant.warehouseQuantity - variant.availableQuantity;
          return (
            <div
              key={variant.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_80px] gap-2 py-1 px-3 pl-8 text-sm text-slate-600 items-center"
            >
              <div>{variant.variantName}</div>
              <div className="text-center">{variant.warehouseQuantity}</div>
              <div className="text-center">
                {area(
                  variant.warehouseQuantity,
                  product.length_mm,
                  product.width_mm,
                )}
              </div>
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
