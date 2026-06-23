import React from "react";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import { ProductReceiptWithProductVariant } from "@/types/product/productReceipt/productReceiptWithProductVariant";
import { deleteProductReceipt } from "@/actions/product/product-receipt/delete";
import { CurrencyEnum, PriceUnitEnum, ProductReceiptTypeEnum } from "@prisma/client";

const currencySymbol: Record<CurrencyEnum, string> = {
  [CurrencyEnum.RUB]: "₽",
  [CurrencyEnum.USD]: "$",
  [CurrencyEnum.RMB]: "¥",
};

const unitLabel: Record<PriceUnitEnum, string> = {
  [PriceUnitEnum.M2]: "м²",
  [PriceUnitEnum.ITEM]: "шт",
};

const typeLabel: Record<ProductReceiptTypeEnum, string> = {
  [ProductReceiptTypeEnum.SHIPMENT]: "поставка",
  [ProductReceiptTypeEnum.RETURN]: "возврат",
  [ProductReceiptTypeEnum.CORRECTION]: "коррекция",
  [ProductReceiptTypeEnum.OTHER]: "другое",
};

const typeColor: Record<ProductReceiptTypeEnum, string> = {
  [ProductReceiptTypeEnum.SHIPMENT]: "text-emerald-500",
  [ProductReceiptTypeEnum.RETURN]: "text-sky-500",
  [ProductReceiptTypeEnum.CORRECTION]: "text-orange-500",
  [ProductReceiptTypeEnum.OTHER]: "text-slate-500",
};

export function ProductReceiptListItem({
  item,
  isAdmin,
}: {
  item: ProductReceiptWithProductVariant;
  isAdmin?: boolean;
}) {
  const date = new Date(item.receiptDate).toLocaleDateString("ru-RU");

  return (
    <div className="border rounded-md mb-1 p-3 shadow-main">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-4 font-medium text-lg">
          <span>{item.productVariant.product?.sku}</span>
          <span className="text-slate-700">+{item.quantity} шт.</span>
          {isAdmin && (
            <span className="text-xs font-normal text-slate-400">
              остаток: <span className={item.quantityLeft === 0 ? "text-red-400" : "text-emerald-600"}>{item.quantityLeft}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/product-receipts/update/${item.id}`}>
            <RiEdit2Line className="w-5 h-5 hover:text-blue-700 hover:scale-125 cursor-pointer" />
          </Link>
          <DeleteDialog
            id={item.id}
            action={deleteProductReceipt}
            message={`Вы уверены, что хотите удалить поставку товара ${item.productVariant?.product.sku} ${item.productVariant?.variantName} от ${date}`}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
        <span className="text-slate-400">вариант: {item.productVariant.variantName}</span>
        {item.order && (
          <span className="text-slate-500">
            заказ №{item.order.sequenceNumber}/{item.order.year}
          </span>
        )}
        <span className={typeColor[item.type]}>{typeLabel[item.type]}</span>
        {isAdmin && item.price != null && item.priceCurrency && item.priceUnit && (
          <span className="text-slate-500">
            себестоимость: {item.price} {currencySymbol[item.priceCurrency]}/{unitLabel[item.priceUnit]}
          </span>
        )}
        {isAdmin && item.price == null && (
          <span className="text-slate-300">себестоимость не указана</span>
        )}
      </div>
    </div>
  );
}
