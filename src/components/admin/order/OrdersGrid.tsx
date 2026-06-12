"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pencil, FileText } from "lucide-react";
import { CreateOrderForm } from "./CreateOrderForm";
import { type ProductOption } from "./AddOrderItemForm";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deleteOrder } from "@/actions/order/deleteOrder";
import {
  OrderStatusEnum,
  PaymentStatusEnum,
  OrderTypeEnum,
  PriceUnitEnum,
  CurrencyEnum,
  InvoiceTypeEnum,
} from "@prisma/client";

const COLS = "grid-cols-[72px_84px_156px_1fr_52px_72px_88px_96px]";

function formatRub(kopecks: number): string {
  return (
    new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(kopecks / 100) + " ₽"
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ru-RU");
}

function formatShortDate(date: Date): string {
  const d = new Date(date);
  const weekday = d.toLocaleDateString("ru-RU", { weekday: "short" });
  const dayMonth = d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1, 2)} ${dayMonth.slice(0, 5)}`;
}

const ORDER_STATUS_CONFIG: Record<
  OrderStatusEnum,
  { label: string; cls: string }
> = {
  RESERVE: { label: "Резерв", cls: "text-slate-800 font-medium" },
  SHIPMENT_PLANNED: { label: "Доставка", cls: "text-slate-800 font-bold" },
  SHIPPED: { label: "Отгружен", cls: "text-slate-800 font-medium" },
  SELF_PICKUP: { label: "Самовывоз", cls: "text-slate-800 font-medium" },
  CANCELLED: { label: "Отменён", cls: "text-slate-800 font-medium" },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatusEnum,
  { label: string; cls: string }
> = {
  PAID: { label: "Оплачен", cls: "text-slate-800 font-medium" },
  NOT_PAID: { label: "Не оплачен", cls: "text-red-600 font-bold" },
};

const ORDER_TYPE_CONFIG: Record<OrderTypeEnum, { label: string; cls: string }> =
  {
    SALE: { label: "Продажа", cls: "bg-blue-50 text-blue-600" },
    RETURN: { label: "Возврат", cls: "bg-purple-50 text-purple-600" },
  };

const SHIPMENT_DATE_PALETTE = [
  "bg-pink-200 text-pink-900 font-bold",
  "bg-emerald-200 text-emerald-900 font-bold",
  "bg-orange-200 text-orange-900 font-bold",
  "bg-violet-200 text-violet-900 font-bold",
  "bg-sky-200 text-sky-900 font-bold",
  "bg-yellow-200 text-yellow-900 font-bold",
  "bg-rose-200 text-rose-900 font-bold",
  "bg-teal-200 text-teal-900 font-bold",
  "bg-indigo-200 text-indigo-900 font-bold",
  "bg-lime-200 text-lime-900 font-bold",
];

function buildShipmentDateColorMap(
  orders: { status: string; plannedDeliveryDate: Date | null }[],
): Map<string, string> {
  const uniqueDates = Array.from(
    new Set(
      orders
        .filter((o) => o.status === "SHIPMENT_PLANNED" && o.plannedDeliveryDate)
        .map(
          (o) => new Date(o.plannedDeliveryDate!).toISOString().split("T")[0],
        ),
    ),
  ).sort();

  const map = new Map<string, string>();
  uniqueDates.forEach((date, i) => {
    map.set(date, SHIPMENT_DATE_PALETTE[i % SHIPMENT_DATE_PALETTE.length]);
  });
  return map;
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
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

type OrderReserve = {
  id: string;
  productVariantId: string;
  quantity: number;
  status: string;
  productVariant: { variantName: string };
};

type OrderIssue = {
  id: string;
  quantity: number;
  issueDate: Date;
  productVariant: { variantName: string };
};

type OrderReceipt = {
  id: string;
  quantity: number;
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
  reserves: OrderReserve[];
  issues: OrderIssue[];
  receipts: OrderReceipt[];
  invoices: { id: string; sequenceNumber: number; invoiceDate: Date; totalRub: number; invoiceType: InvoiceTypeEnum }[];
  yandexData: { feesSettled: boolean; buyerTotal: number; subsidyTotal: number } | null;
  ozonData: { feesSettled: boolean; buyerTotal: number } | null;
};

type Option = { id: string; name: string };
type DeliveryMethodOption = {
  id: string;
  name: string;
  defaultPriceRub: number | null;
};
type PartnerOption = { id: string; names: string[] };

function OrderNumber({ order, rowSpan }: { order: Order; rowSpan?: number }) {
  return (
    <div
      className="py-0.5 flex flex-col"
      style={rowSpan && rowSpan > 1 ? { gridRow: `span ${rowSpan}` } : undefined}
    >
      <div className="text-sm font-semibold">{order.sequenceNumber}</div>
      {order.orderType === "RETURN" && (
        <div className="text-xs text-slate-400">
          {ORDER_TYPE_CONFIG[order.orderType].label}
        </div>
      )}
      <div className="flex-1" />
      {order.orderType === OrderTypeEnum.SALE && (
        <Link
          href={`/admin/invoices?fromOrderId=${order.id}`}
          className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-blue-500 leading-tight"
          title="Создать счет"
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>Создать счет</span>
        </Link>
      )}
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
  scrollToOrderIds,
  marketplacePaymentMethodIds,
  selfPickupDeliveryMethodId,
}: {
  orders: Order[];
  products: ProductOption[];
  partners: PartnerOption[];
  deliveryMethods: DeliveryMethodOption[];
  paymentMethods: Option[];
  usdRate: number | null;
  rmbRate: number | null;
  scrollToOrderIds?: string[];
  marketplacePaymentMethodIds?: string[];
  selfPickupDeliveryMethodId?: string | null;
}) {
  const marketplacePaymentMethodIdSet = React.useMemo(
    () => new Set(marketplacePaymentMethodIds ?? []),
    [marketplacePaymentMethodIds]
  );
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const scrollTargetRef = React.useRef<HTMLDivElement>(null);
  const shipmentDateColorMap = buildShipmentDateColorMap(orders);
  const highlightSet = React.useMemo(() => new Set(scrollToOrderIds ?? []), [scrollToOrderIds]);

  React.useEffect(() => {
    if (scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scrollToOrderIds]);

  // Group orders by year-month
  const monthGroups: { key: string; label: string; orders: typeof orders }[] =
    [];
  for (const order of orders) {
    const d = new Date(order.orderDate);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    });
    const existing = monthGroups.find((g) => g.key === key);
    if (existing) {
      existing.orders.push(order);
    } else {
      monthGroups.push({ key, label, orders: [order] });
    }
  }
  monthGroups.sort((a, b) => a.key.localeCompare(b.key));

  function monthTotals(groupOrders: typeof orders, shippedOnly: boolean) {
    const filtered = shippedOnly
      ? groupOrders.filter((o) => o.status === "SHIPPED")
      : groupOrders;
    const sign = (o: (typeof orders)[0]) => (o.orderType === "RETURN" ? -1 : 1);
    const totalRub = filtered.reduce((sum, o) => sum + sign(o) * o.totalRub, 0);
    const totalM2 = filtered.reduce(
      (sum, o) =>
        sum + sign(o) * o.items.reduce((s, i) => s + (i.quantityM2 ?? 0), 0),
      0,
    );
    return { count: filtered.length, totalRub, totalM2 };
  }

  if (orders.length === 0) {
    return <p className="text-sm text-slate-400 mt-6">Заказы не найдены</p>;
  }

  return (
    <div className="mt-4">
      {/* Sticky column headers */}
      <div className="hidden md:flex sticky top-0 bg-white z-10 border-b-2 border-slate-300 text-xs text-slate-400 mb-2 mx-px">
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

      {/* Order rows grouped by month */}
      <div className="flex flex-col">
        {monthGroups.map(({ key, label, orders: groupOrders }) => {
          const all = monthTotals(groupOrders, false);
          const shipped = monthTotals(groupOrders, true);
          return (
            <div key={key}>
              <div className="text-sm font-semibold text-slate-500 capitalize mb-2 mt-2 px-1">
                {label}
              </div>
              {groupOrders.map((order) => {
                const partnerName =
                  order.partner.names.find((n) => n.isPrimary)?.name ??
                  order.partner.names[0]?.name ??
                  "—";
                const isEstimate =
                  (order.yandexData != null && !order.yandexData.feesSettled) ||
                  (order.ozonData != null && !order.ozonData.feesSettled);
                const approx = (v: string) => isEstimate ? `≈${v}` : v;
                // For estimate orders show net with gross in brackets: ~12 462 (25 432) ₽
                const fmt0 = (rubles: number) =>
                  Math.round(rubles).toLocaleString("ru-RU");
                const retailPrice = order.yandexData
                  ? order.yandexData.buyerTotal + order.yandexData.subsidyTotal
                  : order.ozonData
                  ? order.ozonData.buyerTotal
                  : null;
                const orderTotalNode = retailPrice != null
                  ? <span className="flex flex-col items-end gap-0"><span>{isEstimate ? "≈" : ""}{fmt0(order.totalRub / 100)} ₽</span><span className="text-xs font-normal text-slate-400">{fmt0(retailPrice)} ₽ розн.</span></span>
                  : <>{formatRub(order.totalRub)}</>;

                return (
                  <div
                    key={order.id}
                    ref={highlightSet.size > 0 && order.id === [...highlightSet][0] ? scrollTargetRef : undefined}
                    className={`border rounded-md shadow-main overflow-hidden mb-3${highlightSet.has(order.id) ? " highlight-flash" : ""}`}
                    style={
                      order.status === "RESERVE" ||
                      order.status === "SHIPMENT_PLANNED" ||
                      order.status === "SELF_PICKUP"
                        ? { "--card-bg": "#fff7da", backgroundColor: "#fff7da" } as React.CSSProperties
                        : { "--card-bg": "#ffffff" } as React.CSSProperties
                    }
                  >
                    <div className="flex flex-col md:flex-row md:items-start">
                      {/* Desktop grid */}
                      <div
                        className={`hidden md:grid flex-1 min-w-0 ${COLS} gap-x-3 px-3 py-2 items-start`}
                      >
                        {order.items.length === 0 ? (
                          <>
                            <OrderNumber order={order} />
                            <div className="text-sm text-slate-600 py-1.5">
                              {formatDate(order.orderDate)}
                            </div>
                            <div className="text-sm py-1.5">{partnerName}</div>
                            <div className="col-span-5 text-sm text-slate-400 italic py-1.5">
                              Нет товаров —{" "}
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="text-blue-500 hover:underline"
                              >
                                добавить
                              </Link>
                            </div>
                          </>
                        ) : (
                          <>
                            {(() => {
                              const rowSpan =
                                order.items.length +
                                (order.discountPercent > 0 ? 1 : 0) +
                                (order.deliveryPriceRub > 0 ? 1 : 0);
                              return order.items.map((item, idx) => (
                              <React.Fragment key={item.id}>
                                {idx === 0 ? (
                                  <>
                                    <OrderNumber order={order} rowSpan={rowSpan} />
                                    <div className="text-sm text-slate-600 py-0.5">
                                      {formatDate(order.orderDate)}
                                    </div>
                                    <div className="text-sm py-0.5">
                                      {partnerName}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <E />
                                    <E />
                                  </>
                                )}
                                <div className="text-sm py-0.5">
                                  {item.product.sku}
                                  {(() => {
                                    const p = products.find(
                                      (p) => p.id === item.productId,
                                    );
                                    const activeVariants =
                                      p?.productVariants ?? [];
                                    const hideVariant =
                                      activeVariants.length <= 1;
                                    return !hideVariant &&
                                      item.productVariant.variantName ? (
                                      <span className="text-slate-400 ml-1 text-xs">
                                        ({item.productVariant.variantName})
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                <div className="text-sm text-right py-0.5">
                                  {order.orderType === "RETURN"
                                    ? `-${item.quantity}`
                                    : item.quantity}
                                </div>
                                <div className="text-sm text-right py-0.5">
                                  {item.quantityM2 !== null
                                    ? order.orderType === "RETURN"
                                      ? `-${item.quantityM2.toFixed(2)}`
                                      : item.quantityM2.toFixed(2)
                                    : "—"}
                                </div>
                                <div className="text-sm text-right py-0.5">
                                  {approx(formatRub(item.priceRub))}
                                </div>
                                <div className="text-sm text-right py-0.5">
                                  {order.orderType === "RETURN"
                                    ? `-${approx(formatRub(item.totalRub))}`
                                    : approx(formatRub(item.totalRub))}
                                </div>
                              </React.Fragment>
                            ));
                            })()}
                            {order.discountPercent > 0 && (() => {
                              const itemsSubtotal = order.items.reduce((s, i) => s + i.totalRub, 0);
                              const discountAmount = Math.round(itemsSubtotal * order.discountPercent / 100);
                              return (
                                <>
                                  <E />
                                  <E />
                                  <div className="text-sm text-slate-500 italic py-0.5">
                                    Скидка {order.discountPercent}%
                                  </div>
                                  <E />
                                  <E />
                                  <E />
                                  <div className="text-sm text-right py-0.5 text-slate-500">
                                    −{formatRub(discountAmount)}
                                  </div>
                                </>
                              );
                            })()}
                            {order.deliveryPriceRub > 0 && (
                              <>
                                <E />
                                <E />
                                <div className="text-sm text-slate-500 italic py-0.5">
                                  {order.deliveryMethod?.name ?? "Доставка"}
                                </div>
                                <E />
                                <E />
                                <E />
                                <div className="text-sm text-right py-0.5 text-slate-600">
                                  {formatRub(order.deliveryPriceRub)}
                                </div>
                              </>
                            )}
                            <>
                              <div className="flex items-center gap-3 py-1 border-t border-slate-200">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenOrderId(
                                      openOrderId === order.id
                                        ? null
                                        : order.id,
                                    )
                                  }
                                  className="text-slate-400 hover:text-blue-500"
                                  title="Редактировать"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="col-span-2 text-xs text-slate-700 italic py-1 border-t border-slate-200 flex items-center">
                                {order.note}
                              </div>
                              <div className="text-sm font-semibold py-1 border-t border-slate-200">
                                Итого
                              </div>
                              <E />
                              <E />
                              <E />
                              <div className="text-sm font-semibold text-right py-1 border-t border-slate-200">
                                {order.orderType === "RETURN" ? <span>-{orderTotalNode}</span> : orderTotalNode}
                              </div>
                            </>
                          </>
                        )}
                      </div>

                      {/* Mobile layout */}
                      <div className="flex-1 md:hidden flex flex-col px-3 py-2 gap-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm font-semibold mr-2">
                              {order.sequenceNumber}
                            </span>
                            <span className="text-sm text-slate-500">
                              {formatDate(order.orderDate)}
                            </span>
                            {order.orderType === "RETURN" && (
                              <span className="text-xs text-slate-400 ml-2">
                                {ORDER_TYPE_CONFIG[order.orderType].label}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenOrderId(
                                openOrderId === order.id ? null : order.id,
                              )
                            }
                            className="text-slate-400 hover:text-blue-500"
                            title="Редактировать"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm">{partnerName}</div>
                        {order.items.map((item) => {
                          const p = products.find(
                            (p) => p.id === item.productId,
                          );
                          const hideVariant =
                            (p?.productVariants ?? []).length <= 1;
                          return (
                            <div
                              key={item.id}
                              className="flex items-baseline justify-between text-sm gap-2"
                            >
                              <div>
                                {item.product.sku}
                                {!hideVariant &&
                                  item.productVariant.variantName && (
                                    <span className="text-slate-400 ml-1 text-xs">
                                      ({item.productVariant.variantName})
                                    </span>
                                  )}
                              </div>
                              <div className="text-right whitespace-nowrap text-slate-600">
                                {order.orderType === "RETURN"
                                  ? `-${item.quantity}`
                                  : item.quantity}{" "}
                                шт ·{" "}
                                {order.orderType === "RETURN"
                                  ? `-${approx(formatRub(item.totalRub))}`
                                  : approx(formatRub(item.totalRub))}
                              </div>
                            </div>
                          );
                        })}
                        {order.discountPercent > 0 && (() => {
                          const itemsSubtotal = order.items.reduce((s, i) => s + i.totalRub, 0);
                          const discountAmount = Math.round((itemsSubtotal + order.deliveryPriceRub) * order.discountPercent / 100);
                          return (
                            <div className="flex justify-between text-sm text-slate-500">
                              <span className="italic">Скидка {order.discountPercent}%</span>
                              <span>−{formatRub(discountAmount)}</span>
                            </div>
                          );
                        })()}
                        {order.deliveryPriceRub > 0 && (
                          <div className="flex justify-between text-sm text-slate-500">
                            <span className="italic">
                              {order.deliveryMethod?.name ?? "Доставка"}
                            </span>
                            <span>{formatRub(order.deliveryPriceRub)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-1 mt-0.5">
                          <span className="flex items-baseline gap-2">
                            {order.note && (
                              <span className="text-xs font-normal text-slate-700 italic">{order.note}</span>
                            )}
                            Итого
                          </span>
                          <span>
                            {order.orderType === "RETURN" ? <span>-{orderTotalNode}</span> : orderTotalNode}
                          </span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="relative md:w-44 md:flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 px-3 py-2 flex flex-row flex-wrap md:flex-col gap-1">
                        <div className="absolute top-2 right-2">
                          <DeleteItemButton
                            action={deleteOrder}
                            fields={{ id: order.id }}
                            message={
                              order.invoices.length > 0
                                ? `Удалить заказ №${order.sequenceNumber}/${order.year}? Связанные счета (${order.invoices.length} шт.) останутся, но будут откреплены от заказа.`
                                : `Удалить заказ №${order.sequenceNumber}/${order.year}?`
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge
                            label={
                              order.status === "SHIPPED" && order.deliveryDate
                                ? `${ORDER_STATUS_CONFIG[order.status].label} ${formatDate(order.deliveryDate)}`
                                : order.status === "SHIPMENT_PLANNED"
                                  ? (() => {
                                      const isPickup = order.deliveryMethodId === selfPickupDeliveryMethodId && selfPickupDeliveryMethodId != null;
                                      const prefix = isPickup ? "Самовывоз" : ORDER_STATUS_CONFIG[order.status].label;
                                      const datePart = order.plannedDeliveryDate ? ` ${formatShortDate(order.plannedDeliveryDate)}` : (isPickup ? "" : " ???");
                                      return prefix + datePart;
                                    })()
                                  : ORDER_STATUS_CONFIG[order.status].label
                            }
                            cls={
                              order.status === "SHIPMENT_PLANNED"
                                ? order.plannedDeliveryDate
                                  ? (shipmentDateColorMap.get(
                                      new Date(order.plannedDeliveryDate)
                                        .toISOString()
                                        .split("T")[0],
                                    ) ?? ORDER_STATUS_CONFIG[order.status].cls)
                                  : ORDER_STATUS_CONFIG[order.status].cls
                                : ORDER_STATUS_CONFIG[order.status].cls
                            }
                          />

                          {order.paymentMethodId == null || !marketplacePaymentMethodIdSet.has(order.paymentMethodId) ? (
                            <Badge {...PAYMENT_STATUS_CONFIG[order.paymentStatus]} />
                          ) : null}
                        </div>
                        {order.reserves.filter((r) => r.status === "ACTIVE")
                          .length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {order.reserves
                              .filter((r) => r.status === "ACTIVE")
                              .map((r) => (
                                <Link
                                  key={r.id}
                                  href={`/admin/products/product-reserves/update/${r.id}`}
                                  className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                >
                                  Резерв создан ({r.quantity} шт)
                                </Link>
                              ))}
                          </div>
                        )}
                        {order.issues.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {order.issues.map((issue) => (
                              <Link
                                key={issue.id}
                                href={`/admin/products/product-issues/update/${issue.id}`}
                                className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                Списание создано ({issue.quantity} шт)
                              </Link>
                            ))}
                          </div>
                        )}
                        {order.receipts.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {order.receipts.map((receipt) => (
                              <Link
                                key={receipt.id}
                                href={`/admin/products/product-receipts/update/${receipt.id}`}
                                className="text-xs text-sky-600 hover:text-sky-800 hover:underline"
                              >
                                Приход создан ({receipt.quantity} шт)
                              </Link>
                            ))}
                          </div>
                        )}
                        {order.invoices.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {order.invoices.map((inv) => {
                              const d = new Date(inv.invoiceDate);
                              const date = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(-2)}`;
                              const amount = Math.round(inv.totalRub / 100).toLocaleString("ru-RU");
                              const type = inv.invoiceType === InvoiceTypeEnum.CASH ? "нал" : "безнал";
                              return (
                                <Link
                                  key={inv.id}
                                  href={`/admin/invoices?tab=${inv.invoiceType}&scrollToInvoiceId=${inv.id}`}
                                  className="text-xs text-violet-600 hover:text-violet-800 hover:underline"
                                >
                                  Счет №{inv.sequenceNumber} от {date} {amount}р. {type}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* end flex */}

                    {/* Edit order form */}
                    <CreateOrderForm
                      partners={partners}
                      deliveryMethods={deliveryMethods}
                      paymentMethods={paymentMethods}
                      products={products}
                      usdRate={usdRate}
                      rmbRate={rmbRate}
                      marketplacePaymentMethodId={order.paymentMethodId != null && marketplacePaymentMethodIdSet.has(order.paymentMethodId) ? order.paymentMethodId : null}
                      isOpen={openOrderId === order.id}
                      onToggle={() =>
                        setOpenOrderId(
                          openOrderId === order.id ? null : order.id,
                        )
                      }
                      initialOrder={{
                        id: order.id,
                        orderDate: order.orderDate,
                        partnerId: order.partnerId,
                        orderType: order.orderType,
                        status: order.status,
                        deliveryMethodId: order.deliveryMethodId,
                        deliveryPriceRub: order.deliveryPriceRub,

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
                          totalRub: item.totalRub,
                        })),
                      }}
                    />
                  </div>
                );
              })}

              {/* Month summary */}
              <div className="mb-6 mt-1 px-3 text-xs flex flex-col gap-0.5">
                {[
                  { label: "Итого:", data: all },
                  { label: "Отгружено:", data: shipped },
                ].map(({ label, data }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 md:gap-6 text-slate-600"
                  >
                    <span className="w-20 md:w-24 font-medium">{label}</span>
                    <span className="w-16 md:w-24">
                      <span className="text-slate-400">Зак: </span>
                      {data.count}
                    </span>
                    <span className="w-16 md:w-24">
                      <span className="text-slate-400">М²: </span>
                      {data.totalM2.toFixed(2)}
                    </span>
                    <span>
                      <span className="text-slate-400 md:inline">Сумма: </span>
                      {formatRub(data.totalRub)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
