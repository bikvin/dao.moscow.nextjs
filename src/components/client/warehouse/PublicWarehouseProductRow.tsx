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
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-3 rounded-md bg-slate-100 items-center">
      <div>{product.sku}</div>
      <div className="text-center">{totalWarehouse}</div>
      <div className="text-center">{area(totalWarehouse, product.length_mm, product.width_mm)}</div>
      <div className="text-center text-green-700">{totalAvailable}</div>
      <div className="text-center text-green-700">{area(totalAvailable, product.length_mm, product.width_mm)}</div>
      <div className="text-center text-amber-600">{totalReserved}</div>
      <div className="text-center text-amber-600">{area(totalReserved, product.length_mm, product.width_mm)}</div>
    </div>
  );
}
