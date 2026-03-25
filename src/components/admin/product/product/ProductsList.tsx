"use client";

import { ProductListItem } from "./ProductListItem";
import { ProductWithGroup } from "@/types/product/productWithGroup";

export default function ProductsList({ productData }: { productData: ProductWithGroup[] }) {
  const grouped = productData.reduce((acc, product) => {
    const groupId = product.productGroupId;
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(product);
    return acc;
  }, {} as Record<string, ProductWithGroup[]>);

  if (productData.length === 0) {
    return (
      <div className="text-center text-xl mt-10 font-light tracking-widest">
        Товаров пока нет
      </div>
    );
  }

  return (
    <div>
      {Object.entries(grouped).map(([groupId, items], index) => (
        <div key={groupId} className={index !== 0 ? "mt-12 pt-8 border-t" : ""}>
          {items.map((item) => (
            <ProductListItem key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}
