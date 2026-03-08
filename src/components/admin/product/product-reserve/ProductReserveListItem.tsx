import React from "react";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { ConfirmDialog } from "@/components/common/confirm/ConfirmDialog";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import { ProductReserveWithProductVariant } from "@/types/product/productReserve/productReserveWithProductVariant";
import { deleteProductReserve } from "@/actions/product/product-reserve/delete";
import { fulfillProductReserve } from "@/actions/product/product-reserve/fulfill";
import { ProductReserveStatusEnum } from "@prisma/client";

const statusLabels: Record<ProductReserveStatusEnum, string> = {
  [ProductReserveStatusEnum.ACTIVE]: "активен",
  [ProductReserveStatusEnum.FULFILLED]: "выполнен",
  [ProductReserveStatusEnum.CANCELLED]: "отменён",
};

const statusColors: Record<ProductReserveStatusEnum, string> = {
  [ProductReserveStatusEnum.ACTIVE]: "text-green-600",
  [ProductReserveStatusEnum.FULFILLED]: "text-slate-400",
  [ProductReserveStatusEnum.CANCELLED]: "text-red-400",
};

export function ProductReserveListItem({
  item,
}: {
  item: ProductReserveWithProductVariant;
}) {
  const date = new Date(item.reserveDate).toLocaleDateString("ru-RU");

  return (
    <div className="border rounded-md mb-1 p-3 shadow-main">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-4 font-medium text-lg">
          <span>{item.productVariant.product?.sku}</span>
          <span className="text-slate-700">{item.quantity} шт.</span>
          <span className="text-slate-600">{item.client}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/product-reserves/update/${item.id}`}>
            <RiEdit2Line className="w-5 h-5 hover:text-blue-700 hover:scale-125 cursor-pointer" />
          </Link>
          <DeleteDialog
            id={item.id}
            action={deleteProductReserve}
            message={`Вы уверены, что хотите удалить резерв товара ${item.productVariant?.product.sku} ${item.productVariant?.variantName} для ${item.client} от ${date}`}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm items-center">
        <span className="text-slate-400">
          вариант: {item.productVariant.variantName}
        </span>
        <span className={statusColors[item.status]}>
          {statusLabels[item.status]}
        </span>
        {item.status === ProductReserveStatusEnum.ACTIVE && (
          <ConfirmDialog
            id={item.id}
            action={fulfillProductReserve}
            message={`Резерв ${item.productVariant?.product.sku} ${item.productVariant?.variantName} для ${item.client} (${item.quantity} шт.) будет отмечен как выполненный, и будет создано списание.`}
            confirmLabel="Подтвердить"
            confirmColor="green"
            trigger={
              <span className="text-xs text-green-800 bg-green-100 hover:bg-green-200 rounded px-2 py-0.5 cursor-pointer">
                Создать списание из резерва
              </span>
            }
          />
        )}
      </div>
    </div>
  );
}
