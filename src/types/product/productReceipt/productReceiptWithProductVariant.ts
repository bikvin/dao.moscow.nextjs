import { Product, ProductReceipt, ProductVariant } from "@prisma/client";

export type ProductReceiptWithProductVariant = ProductReceipt & {
  productVariant:
    | ProductVariant & {
        product: Product;
      };
};
