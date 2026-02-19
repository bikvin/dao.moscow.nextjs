import { Product, ProductReserve, ProductVariant } from "@prisma/client";

export type ProductReserveWithProductVariant = ProductReserve & {
  productVariant: ProductVariant & {
    product: Product;
  };
};
