// import classes from "./accordionItemsEdit.module.css";
"use client";

import { ProductStatusEnum } from "@prisma/client";
import { ProductListItem } from "./ProductListItem";
import { ProductWithGroup } from "@/types/product/productWithGroup";
import { useState } from "react";

export default function ProductsList({
  productData,
}: {
  productData: ProductWithGroup[];
}) {
  const activeProducts = productData.filter(
    (product) => product.status === ProductStatusEnum.ACTIVE
  );
  const cancelledProducts = productData.filter(
    (product) => product.status === ProductStatusEnum.CANCELLED
  );

  const [cancelledShown, setCancelledShown] = useState(false);

  // Group active products by productGroup
  const grouped = activeProducts.reduce((acc, product) => {
    const groupId = product.productGroupId;
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(product);
    return acc;
  }, {} as Record<string, ProductWithGroup[]>);

  return (
    <>
      <div>
        <h3 className="text-xl mb-4">Активные товары:</h3>
        {activeProducts.length === 0 && (
          <div className="text-center text-xl mt-10 font-light tracking-widest">
            Товаров пока нет
          </div>
        )}

        {Object.entries(grouped).map(([groupId, items], index) => (
          <div
            key={groupId}
            className={index !== 0 ? "mt-12 pt-8 border-t" : ""}
          >
            {items.map((item) => (
              <ProductListItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      <div
        className="text-gray-500 mb-4 cursor-pointer underline"
        onClick={() => setCancelledShown((prev) => !prev)}
      >
        {cancelledShown ? "Скрыть снятые товары" : "Показать снятые товары"}
      </div>
      {cancelledShown && (
        <div>
          <h3 className="text-xl mb-4">Снятые с продажи товары:</h3>
          {cancelledProducts.length === 0 && (
            <div className="text-center text-xl mt-10 font-light tracking-widest">
              Товаров пока нет
            </div>
          )}
          <div className="mb-10">
            {cancelledProducts.map((item) => (
              // <UsersListItem key={item.id} user={item} />
              <ProductListItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
