import React from "react";
import Link from "next/link";
import { OrderNoteForm } from "./OrderNoteForm";
import { CreateOrderForm } from "./CreateOrderForm";
import { type ProductOption } from "./AddOrderItemForm";
import { OrderStatusEnum, DeliveryStatusEnum, PaymentStatusEnum, OrderTypeEnum, PriceUnitEnum, CurrencyEnum } from "@prisma/client";

const COLS = "grid-cols-[72px_84px_156px_1fr_52px_72px_88px_96px_180px]";

function formatRub(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU").format(kopecks / 100) + " ₽";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ru-RU");
}

const ORDER_STATUS_CONFIG: Record<OrderStatusEnum, { label: string; cls: string }> = {
  ACTIVE:    { label: "Активен",   cls: "bg-amber-100 text-amber-700" },
  FULFILLED: { label: "Выполнен",  cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Отменён",   cls: "bg-red-100 text-red-600" },
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
  paymentMethodId: string | null;
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
    <div className="py-1.5">
      <Link
        href={`/admin/orders/${order.id}`}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        {order.sequenceNumber}
      </Link>
      <div className="mt-0.5">
        <Badge {...ORDER_TYPE_CONFIG[order.orderType]} />
      </div>
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
  if (orders.length === 0) {
    return <p className="text-sm text-slate-400 mt-6">Заказы не найдены</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      {/* Sticky column headers */}
      <div className={`sticky top-0 bg-white z-10 grid ${COLS} gap-x-3 px-2 py-1.5 border-b-2 border-slate-300 text-xs text-slate-400`}>
        <div>#</div>
        <div>Дата</div>
        <div>Партнёр</div>
        <div>Товар</div>
        <div className="text-right">Кол</div>
        <div className="text-right">М²</div>
        <div className="text-right">Цена</div>
        <div className="text-right">Сумма</div>
        <div>Статусы</div>
      </div>

      {/* Order rows */}
      <div className="flex flex-col">
        {orders.map((order) => {
          const partnerName =
            order.partner.names.find((n) => n.isPrimary)?.name ??
            order.partner.names[0]?.name ??
            "—";

          return (
            <div key={order.id} className="border-b border-slate-200 py-1">
              <div className={`grid ${COLS} gap-x-3 px-2`}>

                {order.items.length === 0 ? (
                  /* Empty order */
                  <>
                    <OrderNumber order={order} />
                    <div className="text-sm text-slate-600 py-1.5">{formatDate(order.orderDate)}</div>
                    <div className="text-sm py-1.5">{partnerName}</div>
                    <div className="col-span-6 text-sm text-slate-400 italic py-1.5">
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
                            <div className="text-sm text-slate-600 py-1.5">{formatDate(order.orderDate)}</div>
                            <div className="text-sm py-1.5">{partnerName}</div>
                          </>
                        ) : (
                          <><E /><E /><E /></>
                        )}
                        <div className="text-sm py-1.5">
                          {item.product.sku}
                          {item.productVariant.variantName && (
                            <span className="text-slate-400 ml-1 text-xs">
                              ({item.productVariant.variantName})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-right py-1.5">{item.quantity}</div>
                        <div className="text-sm text-right py-1.5">
                          {item.quantityM2 !== null ? item.quantityM2.toFixed(2) : "—"}
                        </div>
                        <div className="text-sm text-right py-1.5">{formatRub(item.priceRub)}</div>
                        <div className="text-sm text-right py-1.5">{formatRub(item.totalRub)}</div>
                        <E />
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
                        <E />
                      </>
                    )}

                    {/* Total row */}
                    <>
                      <E /><E /><E />
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
                      <div className="flex flex-wrap gap-1 py-1 items-start border-t border-slate-200">
                        <Badge {...ORDER_STATUS_CONFIG[order.status]} />
                        <Badge {...DELIVERY_STATUS_CONFIG[order.deliveryStatus]} />
                        <Badge {...PAYMENT_STATUS_CONFIG[order.paymentStatus]} />
                      </div>
                    </>
                  </>
                )}
              </div>

              {/* Note form */}
              <div className="px-2 pt-1">
                <OrderNoteForm orderId={order.id} initialNote={order.note} />
              </div>

              {/* Edit order form */}
              <div className="px-2 pb-1">
                <CreateOrderForm
                  partners={partners}
                  deliveryMethods={deliveryMethods}
                  paymentMethods={paymentMethods}
                  products={products}
                  usdRate={usdRate}
                  rmbRate={rmbRate}
                  initialOrder={{
                    id: order.id,
                    orderDate: order.orderDate,
                    partnerId: order.partnerId,
                    orderType: order.orderType,
                    deliveryMethodId: order.deliveryMethodId,
                    deliveryPriceRub: order.deliveryPriceRub,
                    paymentMethodId: order.paymentMethodId,
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
