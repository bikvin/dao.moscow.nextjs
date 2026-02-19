import React from "react";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import { ProductIssueWithProductVariant } from "@/types/product/productIssue/productIssueWithProductVariant";
import { deleteProductIssue } from "@/actions/product/product-issue/delete";
import { ProductIssueEnum } from "@prisma/client";

export function ProductIssueListItem({
  item,
}: {
  item: ProductIssueWithProductVariant;
}) {
  const date = new Date(item.issueDate).toLocaleDateString("ru-RU");

  return (
    <div className="relative flex flex-col border rounded-md mb-1 p-2 shadow-main">
      <div className="absolute top-4 right-4 flex gap-2 flex-row">
        <Link
          className=""
          href={`/admin/products/product-issues/update/${item.id}`}
        >
          <RiEdit2Line className="w-6 h-6 hover:text-blue-700 hover:scale-125 cursor-pointer" />
        </Link>
        <DeleteDialog
          id={item.id}
          action={deleteProductIssue}
          message={`Вы уверены, что хотите удалить списание товара ${item.productVariant?.product.sku} ${item.productVariant?.variantName} от ${date}`}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-start items-center">
        <div className="p-1">
          <div className="flex items-center text-lg">
            <div className="pr-2 min-w-40">
              {item.productVariant.product?.sku}
            </div>

            <div className="flex pr-8">
              -<div className="pr-1">{item.quantity}</div>шт.
            </div>

            <div className="text-sm pr-12 text-slate-400">
              вариант: {item.productVariant.variantName}
            </div>
            <div className="text-sm text-orange-500">
              {item.type === ProductIssueEnum.CORRECTION
                ? "коррекция"
                : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
