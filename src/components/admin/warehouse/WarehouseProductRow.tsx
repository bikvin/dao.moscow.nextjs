import { ProductWithVariants } from "@/types/product/productWithVariants";

export function WarehouseProductRow({
  product,
}: {
  product: ProductWithVariants;
}) {
  const variants = product.productVariants;
  const multiVariant = variants.length > 1;

  const totalWarehouse = variants.reduce((s, v) => s + v.warehouseQuantity, 0);
  const totalAvailable = variants.reduce((s, v) => s + v.availableQuantity, 0);
  const totalReserved = totalWarehouse - totalAvailable;

  return (
    <div>
      {/* Product row */}
      <div className="grid grid-cols-4 gap-2 py-2 px-3 rounded-md bg-slate-100 font-medium">
        <div>{product.sku}</div>
        <div className="text-center">{totalWarehouse}</div>
        <div className="text-center text-amber-600">{totalReserved}</div>
        <div className="text-center text-green-700">{totalAvailable}</div>
      </div>

      {/* Variant rows */}
      {multiVariant &&
        variants.map((variant) => {
          const reserved = variant.warehouseQuantity - variant.availableQuantity;
          return (
            <div
              key={variant.id}
              className="grid grid-cols-4 gap-2 py-1 px-3 pl-8 text-sm text-slate-600"
            >
              <div>{variant.variantName}</div>
              <div className="text-center">{variant.warehouseQuantity}</div>
              <div className="text-center text-amber-500">{reserved}</div>
              <div className="text-center text-green-600">
                {variant.availableQuantity}
              </div>
            </div>
          );
        })}
    </div>
  );
}
