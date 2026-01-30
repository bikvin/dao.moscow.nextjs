import { Product, ProductVariant } from "@prisma/client";

export type ProductWithVariants = Product & {
  productVariants: ProductVariant[];
};
