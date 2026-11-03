import { ProductWithVariants } from "@/types/product/productWithVariants";

function area(quantity: number, length_mm: number, width_mm: number): string {
  return ((quantity * length_mm * width_mm) / 1_000_000).toFixed(2);
}

// Renders one product row for the public warehouse table.
export function PublicWarehouseProductRow({
  product,
  index,
}: {
  product: ProductWithVariants;
  index: number;
}) {
  const variants = product.productVariants;

  const totalWarehouse = variants.reduce((s, v) => s + v.warehouseQuantity, 0);
  const totalAvailable = Math.max(0, variants.reduce((s, v) => s + v.availableQuantity, 0));

  return (
    <div className="relative border-b border-slate-200 hover:bg-slate-100">
      {/* Mobile card */}
      <div className="md:hidden flex flex-col gap-1 py-2 px-3 text-sm mt-4">
        <div className="font-bold">
          <span className="text-slate-400 font-normal text-xs mr-1">{index}.</span>
          {product.sku}
        </div>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 mt-1">
          <span />
          <span className="text-slate-400 text-xs text-center">листов</span>
          <span className="text-slate-400 text-xs text-center">м²</span>

          <span className="text-slate-600 font-medium pt-1">Доступно для заказа</span>
          <span className="text-green-700 font-semibold text-center pt-1">{totalAvailable}</span>
          <span className="text-green-700 font-semibold text-center pt-1">{area(totalAvailable, product.length_mm, product.width_mm)}</span>

          <span className="text-slate-400 text-xs pt-2">Всего на складе</span>
          <span className="text-slate-400 text-xs text-center pt-2">{totalWarehouse}</span>
          <span className="text-slate-400 text-xs text-center pt-2">{area(totalWarehouse, product.length_mm, product.width_mm)}</span>
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden md:flex gap-2 px-3 font-medium items-center">
        <div className="flex-[3] min-w-0 py-2">
          <span className="text-slate-400 font-normal text-xs mr-1">{index}.</span>
          {product.sku}
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
      </div>
    </div>
  );
}
