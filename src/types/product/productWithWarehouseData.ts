import { Product, ProductReserve, ProductVariant } from "@prisma/client";

export type VariantWithActiveReserves = ProductVariant & {
  productReserves: ProductReserve[];
};

export type ProductWithWarehouseData = Product & {
  productVariants: VariantWithActiveReserves[];
};
