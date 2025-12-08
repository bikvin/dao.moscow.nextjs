import { Product, ProductGroup } from "@prisma/client";

export type ProductWithGroup = Product & {
  productGroup: ProductGroup | null;
};
