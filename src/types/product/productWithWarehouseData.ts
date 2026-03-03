import { Product, ProductGroup, ProductReserve, ProductVariant } from "@prisma/client";

export type VariantWithActiveReserves = ProductVariant & {
  productReserves: ProductReserve[];
};

export type ProductWithWarehouseData = Product & {
  productVariants: VariantWithActiveReserves[];
};

export type ProductGroupWithWarehouseData = ProductGroup & {
  products: ProductWithWarehouseData[];
};
