"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { CreateOrderForm } from "./CreateOrderForm";
import { type ProductOption } from "./AddOrderItemForm";
import { OrderStatusEnum, DeliveryStatusEnum, PaymentStatusEnum, OrderTypeEnum, PriceUnitEnum, CurrencyEnum } from "@prisma/client";

const COLS = "grid-cols-[72px_84px_156px_1fr_52px_72px_88px_96px]";

function formatRub(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kopecks / 100) + " ₽";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ru-RU");
}

const ORDER_STATUS_CONFIG: Record<OrderStatusEnum, { label: string; cls: string }> = {
  RESERVE:           { label: "Резерв",                  cls: "bg-amber-100 text-amber-700" },
  SHIPMENT_PLANNED:  { label: "Отгрузка запланирована",  cls: "bg-blue-100 text-blue-700" },
  FULFILLED:         { label: "Выполнен",                cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED:         { label: "Отменён",                 cls: "bg-red-100 text-red-600" },
};

const DELIVERY_STATUS_CONFIG: Record<DeliveryStatusEnum, { label: string; cls: string }> = {
  DELIVERED:     { label: "Доставлен",     cls: "bg-emerald-100 text-emerald-700" },
  NOT_DELIVERED: { label: "Не доставлен",  cls: "bg-slate-100 text-slate-500" },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatusEnum, { label: string; cls: string }> = {
  PAID:     { label: "Оплачен",     cls: "bg-emerald-100 text-emerald-700" },
  NOT_PAID: { label: "Не оплачен",  cls: "bg-orange-100 text-orange-700" },
};

const ORDER_TYPE_CONFIG: Record<OrderTypeEnum, { label: string; cls: string }> = {
  SALE:   { label: "Продажа", cls: "bg-blue-50 text-blue-600" },
  RETURN: { label: "Возврат", cls: "bg-purple-50 text-purple-600" },
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

// Empty grid cell placeholder
function E() {
  return <div />;
}

type OrderItem = {
  id: string;
  productId: string;
  productVariantId: string;
  quantity: number;
  quantityM2: number | null;
  priceUnit: PriceUnitEnum;
  priceInCents: number;
  priceCurrency: CurrencyEnum;
  priceRub: number;
  totalRub: number;
  product: { sku: string };
  productVariant: { variantName: string };
};

type Order = {
  id: string;
  year: number;
  sequenceNumber: number;
  orderDate: Date;
  orderType: OrderTypeEnum;
  partnerId: string;
  status: OrderStatusEnum;
  deliveryStatus: DeliveryStatusEnum;
  paymentStatus: PaymentStatusEnum;
  note: string | null;
  deliveryMethodId: string | null;
  deliveryPriceRub: number;
  plannedDeliveryDate: Date | null;
  deliveryDate: Date | null;
  paymentMethodId: string | null;
  paymentDate: Date | null;
  discountPercent: number;
  totalRub: number;
  partner: { names: { name: string; isPrimary: boolean }[] };
  deliveryMethod: { name: string } | null;
  items: OrderItem[];
};

type Option = { id: string; name: string };
type DeliveryMethodOption = { id: string; name: string; defaultPriceRub: number | null };
type PartnerOption = { id: string; names: string[] };

function OrderNumber({ order }: { order: Order }) {
  return (
    <div className="py-0.5 text-sm font-semibold">
      {order.sequenceNumber}
    </div>
  );
}

export function OrdersGrid({
  orders,
  products,
  partners,
  deliveryMethods,
  paymentMethods,
  usdRate,
  rmbRate,
}: {
  orders: Order[];
  products: ProductOption[];
  partners: PartnerOption[];
  deliveryMethods: DeliveryMethodOption[];
  paymentMethods: Option[];
  usdRate: number | null;
  rmbRate: number | null;
}) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  if (orders.length === 0) {
    return <p className="text-sm text-slate-400 mt-6">Заказы не найдены</p>;
  }

  return (
    <div className="mt-4">
      {/* Sticky column headers */}
      <div className="sticky top-0 bg-white z-10 flex border-b-2 border-slate-300 text-xs text-slate-400 mb-2 mx-px">
        <div className={`flex-1 min-w-0 grid ${COLS} gap-x-3 px-3 py-1.5`}>
          <div>#</div>
          <div>Дата</div>
          <div>Партнёр</div>
          <div>Товар</div>
          <div className="text-right">Кол</div>
          <div className="text-right">М²</div>
          <div className="text-right">Цена</div>
          <div className="text-right">Сумма</div>
        </div>
        <div className="w-44 flex-shrink-0" />
      </div>

      {/* Order rows */}
      <div className="flex flex-col">
        {orders.map((order) => {
          const partnerName =
            order.partner.names.find((n) => n.isPrimary)?.name ??
            order.partner.names[0]?.name ??
            "—";

          return (
            <div key={order.id} className="border rounded-md shadow-main overflow-hidden mb-3">
              <div className="flex items-start">
              <div className={`flex-1 min-w-0 grid ${COLS} gap-x-3 px-3 py-2 items-start`}>

                {order.items.length === 0 ? (
                  /* Empty order */
                  <>
                    <OrderNumber order={order} />
                    <div className="text-sm text-slate-600 py-1.5">{formatDate(order.orderDate)}</div>
                    <div className="text-sm py-1.5">{partnerName}</div>
                    <div className="col-span-5 text-sm text-slate-400 italic py-1.5">
                      Нет товаров —{" "}
                      <Link href={`/admin/orders/${order.id}`} className="text-blue-500 hover:underline">
                        добавить
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Item rows */}
                    {order.items.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        {idx === 0 ? (
                          <>
                            <OrderNumber order={order} />
                            <div className="text-sm text-slate-600 py-0.5">{formatDate(order.orderDate)}</div>
                            <div className="text-sm py-0.5">{partnerName}</div>
                          </>
                        ) : (
                          <><E /><E /><E /></>
                        )}
                        <div className="text-sm py-0.5">
                          {item.product.sku}
                          {(() => {
                            const p = products.find((p) => p.id === item.productId);
                            const activeVariants = p?.productVariants ?? [];
                            const hideVariant = activeVariants.length === 1 && activeVariants[0].isMain;
                            return !hideVariant && item.productVariant.variantName ? (
                              <span className="text-slate-400 ml-1 text-xs">
                                ({item.productVariant.variantName})
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="text-sm text-right py-0.5">{item.quantity}</div>
                        <div className="text-sm text-right py-0.5">
                          {item.quantityM2 !== null ? item.quantityM2.toFixed(2) : "—"}
                        </div>
                        <div className="text-sm text-right py-0.5">{formatRub(item.priceRub)}</div>
                        <div className="text-sm text-right py-0.5">{formatRub(item.totalRub)}</div>
                      </React.Fragment>
                    ))}

                    {/* Delivery row */}
                    {order.deliveryPriceRub > 0 && (
                      <>
                        <E /><E /><E />
                        <div className="text-sm text-slate-500 italic py-0.5">
                          {order.deliveryMethod?.name ?? "Доставка"}
                        </div>
                        <E /><E /><E />
                        <div className="text-sm text-right py-0.5 text-slate-600">
                          {formatRub(order.deliveryPriceRub)}
                        </div>
                      </>
                    )}

                    {/* Total row */}
                    <>
                      <div className="flex items-center py-1 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setOpenOrderId(openOrderId === order.id ? null : order.id)}
                          className="text-slate-400 hover:text-blue-500"
                          title="Редактировать"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </div>
                      <E /><E />
                      <div className="text-sm font-semibold py-1 border-t border-slate-200">
                        Итого
                        {order.discountPercent > 0 && (
                          <span className="text-xs text-slate-400 font-normal ml-2">
                            скидка {order.discountPercent}%
                          </span>
                        )}
                      </div>
                      <E /><E /><E />
                      <div className="text-sm font-semibold text-right py-1 border-t border-slate-200">
                        {formatRub(order.totalRub)}
                      </div>
                    </>
                  </>
                )}
              </div>

              {/* Badges */}
              <div className="relative w-44 flex-shrink-0 border-l border-slate-100 px-3 py-2 flex flex-col gap-1">
                <div className="absolute top-2 right-3 text-xs text-slate-400">{ORDER_TYPE_CONFIG[order.orderType].label}</div>
                <div className="flex flex-wrap gap-1 mt-5">
                  <Badge {...ORDER_STATUS_CONFIG[order.status]} />
                  <Badge {...DELIVERY_STATUS_CONFIG[order.deliveryStatus]} />
                  <Badge {...PAYMENT_STATUS_CONFIG[order.paymentStatus]} />
                </div>
                {order.note && (
                  <div className="text-xs text-slate-400 italic">{order.note}</div>
                )}
              </div>
              </div>{/* end flex */}

              {/* Edit order form */}
              <CreateOrderForm
                partners={partners}
                deliveryMethods={deliveryMethods}
                paymentMethods={paymentMethods}
                products={products}
                usdRate={usdRate}
                rmbRate={rmbRate}
                isOpen={openOrderId === order.id}
                onToggle={() => setOpenOrderId(openOrderId === order.id ? null : order.id)}
                initialOrder={{
                  id: order.id,
                  orderDate: order.orderDate,
                  partnerId: order.partnerId,
                  orderType: order.orderType,
                  deliveryMethodId: order.deliveryMethodId,
                  deliveryPriceRub: order.deliveryPriceRub,
                  deliveryStatus: order.deliveryStatus,
                  plannedDeliveryDate: order.plannedDeliveryDate,
                  deliveryDate: order.deliveryDate,
                  paymentMethodId: order.paymentMethodId,
                  paymentStatus: order.paymentStatus,
                  paymentDate: order.paymentDate,
                  discountPercent: order.discountPercent,
                  note: order.note,
                  items: order.items.map((item) => ({
                    productId: item.productId,
                    productVariantId: item.productVariantId,
                    quantity: item.quantity,
                    priceUnit: item.priceUnit,
                    priceInCents: item.priceInCents,
                    priceCurrency: item.priceCurrency,
                    priceRub: item.priceRub,
                  })),
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
