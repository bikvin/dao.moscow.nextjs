import { Product, ProductReceipt, ProductVariant } from "@prisma/client";

export type ProductReceiptWithProductVariant = ProductReceipt & {
  productVariant: ProductVariant & {
    product: Product;
  };
  order: { year: number; sequenceNumber: number } | null;
};
