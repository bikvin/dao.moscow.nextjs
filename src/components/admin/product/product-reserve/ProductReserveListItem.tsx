import React from "react";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import { ProductReserveWithProductVariant } from "@/types/product/productReserve/productReserveWithProductVariant";
import { deleteProductReserve } from "@/actions/product/product-reserve/delete";
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
    <div className="relative flex flex-col border rounded-md mb-1 p-2 shadow-main">
      <div className="absolute top-4 right-4 flex gap-2 flex-row">
        <Link href={`/admin/products/product-reserves/update/${item.id}`}>
          <RiEdit2Line className="w-6 h-6 hover:text-blue-700 hover:scale-125 cursor-pointer" />
        </Link>
        <DeleteDialog
          id={item.id}
          action={deleteProductReserve}
          message={`Вы уверены, что хотите удалить резерв товара ${item.productVariant?.product.sku} ${item.productVariant?.variantName} для ${item.client} от ${date}`}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-start items-center">
        <div className="p-1">
          <div className="flex items-center text-lg">
            <div className="pr-2 min-w-40">
              {item.productVariant.product?.sku}
            </div>

            <div className="flex pr-8">
              <div className="pr-1">{item.quantity}</div>шт.
            </div>

            <div className="text-sm pr-8 text-slate-400">
              вариант: {item.productVariant.variantName}
            </div>

            <div className="text-sm pr-8 text-slate-600">
              {item.client}
            </div>

            <div className={`text-sm ${statusColors[item.status]}`}>
              {statusLabels[item.status]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
