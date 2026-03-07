import React from "react";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import { ProductIssueWithProductVariant } from "@/types/product/productIssue/productIssueWithProductVariant";
import { deleteProductIssue } from "@/actions/product/product-issue/delete";
import { ProductIssueEnum } from "@prisma/client";

const typeLabel: Record<ProductIssueEnum, string> = {
  [ProductIssueEnum.SALE]: "продажа",
  [ProductIssueEnum.CORRECTION]: "коррекция",
  [ProductIssueEnum.OTHER]: "другое",
};

const typeColor: Record<ProductIssueEnum, string> = {
  [ProductIssueEnum.SALE]: "text-slate-500",
  [ProductIssueEnum.CORRECTION]: "text-orange-500",
  [ProductIssueEnum.OTHER]: "text-slate-500",
};

export function ProductIssueListItem({
  item,
}: {
  item: ProductIssueWithProductVariant;
}) {
  const date = new Date(item.issueDate).toLocaleDateString("ru-RU");

  return (
    <div className="border rounded-md mb-1 p-3 shadow-main">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-4 font-medium text-lg">
          <span>{item.productVariant.product?.sku}</span>
          <span className="text-slate-700">-{item.quantity} шт.</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/product-issues/update/${item.id}`}>
            <RiEdit2Line className="w-5 h-5 hover:text-blue-700 hover:scale-125 cursor-pointer" />
          </Link>
          <DeleteDialog
            id={item.id}
            action={deleteProductIssue}
            message={`Вы уверены, что хотите удалить списание товара ${item.productVariant?.product.sku} ${item.productVariant?.variantName} от ${date}`}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
        <span className="text-slate-400">вариант: {item.productVariant.variantName}</span>
        <span className={typeColor[item.type]}>{typeLabel[item.type]}</span>
      </div>
    </div>
  );
}
