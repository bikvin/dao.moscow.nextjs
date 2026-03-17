import { ProductWithVariants } from "@/types/product/productWithVariants";

function area(quantity: number, length_mm: number, width_mm: number): string {
  return ((quantity * length_mm * width_mm) / 1_000_000).toFixed(2);
}

export function PublicWarehouseProductRow({
  product,
}: {
  product: ProductWithVariants;
}) {
  const variants = product.productVariants;

  const totalWarehouse = variants.reduce((s, v) => s + v.warehouseQuantity, 0);
  const totalAvailable = Math.max(0, variants.reduce((s, v) => s + v.availableQuantity, 0));
  const totalReserved = totalWarehouse - totalAvailable;

  return (
    <>
      {/* Mobile card */}
      <div className="md:hidden flex flex-col gap-1 py-2 px-3 rounded-md bg-slate-100 text-sm">
        <div className="font-bold">{product.sku}</div>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 mt-1">
          <span />
          <span className="text-slate-400 text-xs text-center">листов</span>
          <span className="text-slate-400 text-xs text-center">м²</span>

          <span className="text-slate-400 pt-1">Доступно для заказа</span>
          <span className="text-green-700 text-center pt-1">{totalAvailable}</span>
          <span className="text-green-700 text-center pt-1">{area(totalAvailable, product.length_mm, product.width_mm)}</span>

          <span className="text-slate-400 pt-2">На складе</span>
          <span className="text-center pt-2">{totalWarehouse}</span>
          <span className="text-center pt-2">{area(totalWarehouse, product.length_mm, product.width_mm)}</span>

          <span className="text-slate-400 pt-2">В резерве</span>
          <span className="text-amber-600 text-center pt-2">{totalReserved}</span>
          <span className="text-amber-600 text-center pt-2">{area(totalReserved, product.length_mm, product.width_mm)}</span>
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-3 rounded-md bg-slate-100 items-center">
        <div>{product.sku}</div>
        <div className="text-center text-green-700">{totalAvailable}</div>
        <div className="text-center text-green-700">{area(totalAvailable, product.length_mm, product.width_mm)}</div>
        <div className="text-center">{totalWarehouse}</div>
        <div className="text-center">{area(totalWarehouse, product.length_mm, product.width_mm)}</div>
        <div className="text-center text-amber-600">{totalReserved}</div>
        <div className="text-center text-amber-600">{area(totalReserved, product.length_mm, product.width_mm)}</div>
      </div>
    </>
  );
}
