import { Product, ProductIssue, ProductVariant } from "@prisma/client";

export type ProductIssueWithProductVariant = ProductIssue & {
  productVariant:
    | ProductVariant & {
        product: Product;
      };
};
