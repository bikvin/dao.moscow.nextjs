"use client";

import { useFormState } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { createOrder } from "@/actions/order/orders";
import { updateOrder } from "@/actions/order/updateOrder";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "@/components/admin/partner/CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";
import { OrderTypeEnum, OrderStatusEnum, PriceTypeEnum, PriceUnitEnum, CurrencyEnum, PaymentStatusEnum } from "@prisma/client";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type ProductOption, calcTotalFromPriceRub, calcPriceRubFromTotal } from "./AddOrderItemForm";
import { PartnerCombobox } from "./PartnerCombobox";
import { ProductCombobox } from "./ProductCombobox";

type Option = { id: string; name: string };
type DeliveryMethodOption = { id: string; name: string; defaultPriceRub: number | null };
type PartnerOption = { id: string; names: string[] };

export type InitialOrder = {
  id: string;
  orderDate: Date;
  partnerId: string;
  orderType: OrderTypeEnum;
  status: OrderStatusEnum;
  deliveryMethodId: string | null;
  deliveryPriceRub: number;
  plannedDeliveryDate: Date | null;
  deliveryDate: Date | null;
  paymentMethodId: string | null;
  paymentStatus: PaymentStatusEnum;
  paymentDate: Date | null;
  discountPercent: number;
  note: string | null;
  items: Array<{
    productId: string;
    productVariantId: string;
    quantity: number;
    priceUnit: PriceUnitEnum;
    priceInCents: number;
    priceCurrency: CurrencyEnum;
    priceRub: number;
    totalRub: number;
  }>;
};

type ItemState = {
  id: string;
  productId: string;
  variantId: string;
  quantity: string;
  priceUnit: PriceUnitEnum;
  price: string;
  currency: CurrencyEnum;
  priceRub: string;
  total: string;
};

const ORDER_TYPE_LABELS: Record<OrderTypeEnum, string> = {
  SALE: "Продажа",
  RETURN: "Возврат",
};

const ORDER_STATUS_LABELS: Record<OrderStatusEnum, string> = {
  RESERVE:          "Резерв",
  SHIPMENT_PLANNED: "Отгрузка запланирована",
  SHIPPED:          "Отгружен",
  SELF_PICKUP:      "Самовывоз",
  CANCELLED:        "Отменён",
};

const PRICE_UNIT_LABELS: Record<PriceUnitEnum, string> = {
  M2: "м²",
  ITEM: "шт",
};

const CURRENCY_LABELS: Record<CurrencyEnum, string> = {
  RUB: "₽",
  USD: "$",
  RMB: "¥",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function emptyItem(): ItemState {
  return {
    id: crypto.randomUUID(),
    productId: "",
    variantId: "",
    quantity: "",
    priceUnit: PriceUnitEnum.M2,
    price: "",
    currency: CurrencyEnum.RUB,
    priceRub: "",
    total: "",
  };
}

function ItemRow({
  item,
  products,
  onChange,
  onRemove,
  touched,
  usdRate,
  rmbRate,
}: {
  item: ItemState;
  products: ProductOption[];
  onChange: (update: Partial<ItemState>) => void;
  onRemove: () => void;
  touched: boolean;
  usdRate: number | null;
  rmbRate: number | null;
}) {
  const lastEdited = useRef<"price" | "total">("price");

  const selectedProduct = products.find((p) => p.id === item.productId);
  const availableVariants = selectedProduct?.productVariants ?? [];

  const quantityM2 =
    selectedProduct && item.quantity
      ? (selectedProduct.length_mm * selectedProduct.width_mm * (parseInt(item.quantity) || 0)) /
        1_000_000
      : null;

  const effectivePriceRub = item.currency === CurrencyEnum.RUB ? item.price : item.priceRub;

  return (
    <div className="flex flex-wrap items-start gap-2 pl-2 border-l-2 border-slate-200">
      <Field label="Товар:">
        <input type="hidden" name="productId" value={item.productId} />
        <ProductCombobox
          products={products}
          value={item.productId}
          onChange={(id) => {
            const variants = products.find((p) => p.id === id)?.productVariants ?? [];
            onChange({ productId: id, variantId: variants.length === 1 ? variants[0].id : "" });
          }}
          error={touched && !item.productId}
        />
      </Field>

      <Field label="Вариант:">
        <select
          name="productVariantId"
          value={item.variantId}
          onChange={(e) => onChange({ variantId: e.target.value })}
          className={`admin-form-input text-sm w-36 ${touched && !item.variantId ? "border-red-500" : ""}`}
          disabled={availableVariants.length === 0}
        >
          <option value="">— вариант —</option>
          {availableVariants.map((v) => (
            <option key={v.id} value={v.id}>{v.variantName}</option>
          ))}
        </select>
      </Field>

      <Field label="Кол-во:">
        <input
          name="quantity"
          type="number"
          placeholder="0"
          value={item.quantity}
          onChange={(e) => {
            const v = e.target.value;
            if (lastEdited.current === "total") {
              const calcPriceRub = calcPriceRubFromTotal(item.total, v, item.priceUnit, selectedProduct);
              onChange({ quantity: v, price: calcPriceRub, priceRub: calcPriceRub, currency: CurrencyEnum.RUB });
            } else {
              const rubVal = item.currency === CurrencyEnum.RUB ? item.price : item.priceRub;
              onChange({ quantity: v, total: calcTotalFromPriceRub(rubVal, v, item.priceUnit, selectedProduct) });
            }
          }}
          className={`admin-form-input text-sm w-20 ${touched && !(parseInt(item.quantity) > 0) ? "border-red-500" : ""}`}
          min="1"
        />
      </Field>

      {quantityM2 !== null && (
        <Field label="М²:">
          <div className="text-sm py-1 px-2 bg-slate-100 rounded w-20 text-right border border-slate-200">
            {quantityM2.toFixed(2)}
          </div>
        </Field>
      )}
      <input type="hidden" name="quantityM2" value={quantityM2 !== null ? quantityM2.toFixed(6) : ""} />

      <Field label="Цена:">
        <input
          name="price"
          type="number"
          placeholder="0"
          value={item.price}
          onChange={(e) => {
            lastEdited.current = "price";
            const v = e.target.value;
            const num = parseFloat(v);
            let priceRub = item.priceRub;
            if (item.currency === CurrencyEnum.RUB) {
              priceRub = v;
            } else if (item.currency === CurrencyEnum.USD && usdRate != null && !isNaN(num)) {
              priceRub = (num * usdRate).toFixed(2);
            } else if (item.currency === CurrencyEnum.RMB && rmbRate != null && !isNaN(num)) {
              priceRub = (num * rmbRate).toFixed(2);
            }
            onChange({ price: v, priceRub, total: calcTotalFromPriceRub(priceRub, item.quantity, item.priceUnit, selectedProduct) });
          }}
          className={`admin-form-input text-sm w-28 ${touched && !(parseFloat(effectivePriceRub) > 0) ? "border-red-500" : ""}`}
          min="0"
          step="0.01"
        />
        {selectedProduct && selectedProduct.prices.length > 0 && (
          <div className="flex gap-2 mt-0.5">
            {[PriceTypeEnum.DEALER, PriceTypeEnum.RETAIL].map((type) => {
              const p = selectedProduct.prices.find((pr) => pr.type === type);
              if (!p) return null;
              const val = (p.priceInCents / 100).toString();
              const label = type === PriceTypeEnum.DEALER ? "Дилерская" : "Розничная";
              return (
                <button
                  key={type}
                  type="button"
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => {
                    lastEdited.current = "price";
                    const priceNum = parseFloat(val);
                    let rubPrice = "";
                    if (p.currency === CurrencyEnum.RUB) {
                      rubPrice = val;
                    } else if (p.currency === CurrencyEnum.USD && usdRate != null) {
                      rubPrice = (priceNum * usdRate).toFixed(2);
                    } else if (p.currency === CurrencyEnum.RMB && rmbRate != null) {
                      rubPrice = (priceNum * rmbRate).toFixed(2);
                    }
                    onChange({ price: val, currency: p.currency, priceRub: rubPrice, priceUnit: p.unit, total: calcTotalFromPriceRub(rubPrice, item.quantity, p.unit, selectedProduct) });
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </Field>

      <Field label="Валюта:">
        <select
          name="priceCurrency"
          value={item.currency}
          onChange={(e) => {
            lastEdited.current = "price";
            const c = e.target.value as CurrencyEnum;
            const num = parseFloat(item.price);
            let priceRub = "";
            if (c === CurrencyEnum.RUB) {
              priceRub = item.price;
            } else if (c === CurrencyEnum.USD && usdRate != null && !isNaN(num)) {
              priceRub = (num * usdRate).toFixed(2);
            } else if (c === CurrencyEnum.RMB && rmbRate != null && !isNaN(num)) {
              priceRub = (num * rmbRate).toFixed(2);
            }
            const newTotal = c === CurrencyEnum.RUB
              ? calcTotalFromPriceRub(item.price, item.quantity, item.priceUnit, selectedProduct)
              : "";
            onChange({ currency: c, priceRub, total: newTotal });
          }}
          className="admin-form-input text-sm w-20"
        >
          {Object.values(CurrencyEnum).map((c) => (
            <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
          ))}
        </select>
      </Field>

      <Field label="Цена за:">
        <select
          name="priceUnit"
          value={item.priceUnit}
          onChange={(e) => {
            const u = e.target.value as PriceUnitEnum;
            if (lastEdited.current === "total") {
              const calcPriceRub = calcPriceRubFromTotal(item.total, item.quantity, u, selectedProduct);
              onChange({ priceUnit: u, price: calcPriceRub, priceRub: calcPriceRub, currency: CurrencyEnum.RUB });
            } else {
              const rubVal = item.currency === CurrencyEnum.RUB ? item.price : item.priceRub;
              onChange({ priceUnit: u, total: calcTotalFromPriceRub(rubVal, item.quantity, u, selectedProduct) });
            }
          }}
          className="admin-form-input text-sm w-20"
        >
          {Object.values(PriceUnitEnum).map((u) => (
            <option key={u} value={u}>{PRICE_UNIT_LABELS[u]}</option>
          ))}
        </select>
      </Field>

      {item.currency !== CurrencyEnum.RUB ? (
        <Field label="Цена (₽):">
          <input
            name="priceRub"
            type="number"
            placeholder="0"
            value={item.priceRub}
            onChange={(e) => {
              lastEdited.current = "price";
              const v = e.target.value;
              onChange({ priceRub: v, total: calcTotalFromPriceRub(v, item.quantity, item.priceUnit, selectedProduct) });
            }}
            className={`admin-form-input text-sm w-28 ${touched && !(parseFloat(item.priceRub) > 0) ? "border-red-500" : ""}`}
            min="0"
            step="0.01"
          />
        </Field>
      ) : (
        <input type="hidden" name="priceRub" value={item.price} />
      )}

      <Field label="Итого (₽):">
        <input
          name="itemTotal"
          type="number"
          placeholder="0"
          value={item.total}
          onChange={(e) => {
            lastEdited.current = "total";
            const v = e.target.value;
            const calcPriceRub = calcPriceRubFromTotal(v, item.quantity, item.priceUnit, selectedProduct);
            onChange({ total: v, price: calcPriceRub, priceRub: calcPriceRub, currency: CurrencyEnum.RUB });
          }}
          className="admin-form-input text-sm w-28"
          min="0"
          step="0.01"
        />
      </Field>

      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 mb-1"
        title="Удалить строку"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function CreateOrderForm({
  partners,
  deliveryMethods,
  paymentMethods,
  products,
  usdRate,
  rmbRate,
  initialOrder,
  isOpen: isOpenProp,
  onToggle,
  nextOrderNumber,
  marketplacePaymentMethodId,
  marketplacePaymentMethodIds,
}: {
  partners: PartnerOption[];
  deliveryMethods: DeliveryMethodOption[];
  paymentMethods: Option[];
  products: ProductOption[];
  usdRate: number | null;
  rmbRate: number | null;
  initialOrder?: InitialOrder;
  isOpen?: boolean;
  onToggle?: () => void;
  nextOrderNumber?: number;
  marketplacePaymentMethodId?: string | null;
  marketplacePaymentMethodIds?: string[];
}) {
  // Support both single-ID (from OrdersGrid per-order) and multi-ID (from page-level) interfaces
  const isMarketplaceMethod = (id: string | null | undefined) =>
    !!id && (id === marketplacePaymentMethodId || (marketplacePaymentMethodIds?.includes(id) ?? false));

  const isEditMode = !!initialOrder;
  const boundAction = isEditMode ? updateOrder.bind(null, initialOrder.id) : createOrder;
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenInternal;
  const setIsOpen = onToggle ? () => onToggle() : setIsOpenInternal;
  const [touched, setTouched] = useState(false);
  const [customSeqNum, setCustomSeqNum] = useState(
    !initialOrder && nextOrderNumber ? nextOrderNumber.toString() : ""
  );
  const [partnerId, setPartnerId] = useState(initialOrder?.partnerId ?? "");
  const [orderDate, setOrderDate] = useState(
    initialOrder
      ? new Date(initialOrder.orderDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [orderType, setOrderType] = useState<OrderTypeEnum>(initialOrder?.orderType ?? OrderTypeEnum.SALE);
  const [orderStatus, setOrderStatus] = useState<OrderStatusEnum>(initialOrder?.status ?? OrderStatusEnum.RESERVE);
  const [deliveryMethodId, setDeliveryMethodId] = useState(initialOrder?.deliveryMethodId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(initialOrder?.paymentMethodId ?? "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>(initialOrder?.paymentStatus ?? PaymentStatusEnum.NOT_PAID);
  const [deliveryPrice, setDeliveryPrice] = useState(
    initialOrder?.deliveryPriceRub ? (initialOrder.deliveryPriceRub / 100).toString() : ""
  );
  const [plannedDeliveryDate, setPlannedDeliveryDate] = useState(
    initialOrder?.plannedDeliveryDate ? new Date(initialOrder.plannedDeliveryDate).toISOString().split("T")[0] : ""
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialOrder?.deliveryDate ? new Date(initialOrder.deliveryDate).toISOString().split("T")[0] : ""
  );
  const [paymentDate, setPaymentDate] = useState(
    initialOrder?.paymentDate ? new Date(initialOrder.paymentDate).toISOString().split("T")[0] : ""
  );
  const [discount, setDiscount] = useState(
    initialOrder?.discountPercent ? initialOrder.discountPercent.toString() : ""
  );
  const [note, setNote] = useState(initialOrder?.note ?? "");
  const [items, setItems] = useState<ItemState[]>(
    initialOrder?.items.length
      ? initialOrder.items.map((item) => {
          const priceRubStr = (item.priceRub / 100).toString();
          const qtyStr = item.quantity.toString();
          return {
            id: crypto.randomUUID(),
            productId: item.productId,
            variantId: item.productVariantId,
            quantity: qtyStr,
            priceUnit: item.priceUnit,
            price: (item.priceInCents / 100).toString(),
            currency: item.priceCurrency,
            priceRub: priceRubStr,
            total: (item.totalRub / 100).toString(),
          };
        })
      : [emptyItem()]
  );

  useEffect(() => {
    if (formState.success) {
      setTouched(false);
      if (isEditMode) {
        setIsOpen(false);
      } else {
        setPartnerId("");
        setOrderDate(new Date().toISOString().split("T")[0]);
        setOrderType(OrderTypeEnum.SALE);
        setOrderStatus(OrderStatusEnum.RESERVE);
        setDeliveryMethodId("");
        setDeliveryPrice("");
        setPlannedDeliveryDate("");
        setDeliveryDate("");
        setPaymentMethodId("");
        setPaymentStatus(PaymentStatusEnum.NOT_PAID);
        setPaymentDate("");
        setDiscount("");
        setNote("");
        setCustomSeqNum(nextOrderNumber ? nextOrderNumber.toString() : "");
        setItems([emptyItem()]);
      }
    }
  }, [formState.success, isEditMode]);

  function isValid() {
    if (!partnerId) return false;
    for (const item of items) {
      const effectivePriceRub = item.currency === CurrencyEnum.RUB ? item.price : item.priceRub;
      if (!item.productId || !item.variantId || !(parseInt(item.quantity) > 0) || !(parseFloat(effectivePriceRub) > 0)) return false;
    }
    return true;
  }

  const itemsSubtotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    const quantityM2 = product && item.quantity
      ? (product.length_mm * product.width_mm * (parseInt(item.quantity) || 0)) / 1_000_000
      : null;
    const effectivePriceRub = item.currency === CurrencyEnum.RUB ? item.price : item.priceRub;
    const priceRubNum = parseFloat(effectivePriceRub) || 0;
    const itemTotal = item.priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
      ? quantityM2 * priceRubNum
      : (parseInt(item.quantity) || 0) * priceRubNum;
    return sum + itemTotal;
  }, 0);
  const discountNum = parseFloat(discount) || 0;
  const grandTotal = itemsSubtotal * (1 - discountNum / 100) + (parseFloat(deliveryPrice) || 0);

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateRow = (id: string, update: Partial<ItemState>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...update } : i)));

  const formContent = (
      <form
        action={action}
        onSubmit={(e) => { if (!isValid()) { e.preventDefault(); setTouched(true); } else { setTouched(true); } }}
        className="flex flex-col gap-3"
      >

        {/* Order header fields */}
        <div className="flex flex-wrap items-end gap-2">
          {!isEditMode && (
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">№ заказа:</label>
              <input
                name="customSequenceNumber"
                type="number"
                value={customSeqNum}
                onChange={(e) => setCustomSeqNum(e.target.value)}
                className="admin-form-input text-sm w-24"
                min="1"
                step="1"
              />
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Дата:</label>
            <input
              name="orderDate"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="admin-form-input text-sm w-36"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Партнёр:</label>
            <input type="hidden" name="partnerId" value={partnerId} />
            <PartnerCombobox
              partners={partners}
              value={partnerId}
              onChange={setPartnerId}
              error={touched && !partnerId}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Тип:</label>
            <select
              name="orderType"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderTypeEnum)}
              className="admin-form-input text-sm w-32"
            >
              {Object.values(OrderTypeEnum).map((t) => (
                <option key={t} value={t}>{ORDER_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product rows */}
        {items.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                products={products}
                onChange={(update) => updateRow(item.id, update)}
                onRemove={() => removeRow(item.id)}
                touched={touched}
                usdRate={usdRate}
                rmbRate={rmbRate}
              />
            ))}
          </div>
        )}

        {/* Add product row */}
        <div>
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-blue-500 hover:underline"
          >
            Добавить товар
          </button>
        </div>

        {/* Delivery row 1: method, price */}
        <div className="flex flex-wrap items-start gap-4 pl-2 border-l-2 border-slate-200">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Доставка:</label>
            <select
              name="deliveryMethodId"
              value={deliveryMethodId}
              onChange={(e) => {
                const id = e.target.value;
                setDeliveryMethodId(id);
                const method = deliveryMethods.find((m) => m.id === id);
                setDeliveryPrice(
                  method?.defaultPriceRub != null
                    ? (method.defaultPriceRub / 100).toString()
                    : ""
                );
              }}
              className="admin-form-input text-sm w-44"
            >
              <option value="">— не выбрано —</option>
              {deliveryMethods.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Стоимость доставки:</label>
            <input
              name="deliveryPrice"
              type="number"
              placeholder="0"
              value={deliveryPrice}
              onChange={(e) => setDeliveryPrice(e.target.value)}
              className="admin-form-input text-sm w-40"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Order status + planned delivery date */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Статус заказа:</label>
            <select
              name="orderStatus"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatusEnum)}
              className="admin-form-input text-sm w-52"
            >
              {Object.values(OrderStatusEnum).filter((s) => s !== OrderStatusEnum.SELF_PICKUP).map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Плановая дата доставки:</label>
            <input
              name="plannedDeliveryDate"
              type="date"
              value={plannedDeliveryDate}
              onChange={(e) => setPlannedDeliveryDate(e.target.value)}
              className="admin-form-input text-sm w-36 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={orderStatus !== OrderStatusEnum.SHIPMENT_PLANNED}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Фактическая дата доставки:</label>
            <input
              name="deliveryDate"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="admin-form-input text-sm w-36 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={orderStatus !== OrderStatusEnum.SHIPPED}
            />
          </div>
        </div>




        {/* Payment row 1: method */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Способ оплаты:</label>
            <select
              name="paymentMethodId"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="admin-form-input text-sm w-44"
            >
              <option value="">— не выбрано —</option>
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment row 2: status toggle, date — disabled for marketplace payment methods */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Статус оплаты:</label>
            <input type="hidden" name="paymentStatus" value={isMarketplaceMethod(paymentMethodId) ? PaymentStatusEnum.PAID : paymentStatus} />
            <div className={`flex items-center gap-2 py-1 ${isMarketplaceMethod(paymentMethodId) ? "opacity-40 cursor-not-allowed" : ""}`}>
              <Switch
                checked={isMarketplaceMethod(paymentMethodId) ? true : paymentStatus === PaymentStatusEnum.PAID}
                onCheckedChange={(checked) => setPaymentStatus(checked ? PaymentStatusEnum.PAID : PaymentStatusEnum.NOT_PAID)}
                disabled={isMarketplaceMethod(paymentMethodId)}
              />
              <span className={`text-sm font-medium ${(isMarketplaceMethod(paymentMethodId) || paymentStatus === PaymentStatusEnum.PAID) ? "text-emerald-700" : "text-slate-400"}`}>
                {(isMarketplaceMethod(paymentMethodId) || paymentStatus === PaymentStatusEnum.PAID) ? "Оплачен" : "Не оплачен"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-400">Дата оплаты:</label>
            <input
              name="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="admin-form-input text-sm w-36 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isMarketplaceMethod(paymentMethodId) || paymentStatus !== PaymentStatusEnum.PAID}
            />
          </div>
        </div>

        {/* Discount */}
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-400">Скидка (%):</label>
          <div className="flex items-center gap-2">
            <input
              name="discountPercent"
              type="number"
              placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="admin-form-input text-sm w-28"
              min="0"
              max="100"
              step="0.1"
            />
            {discountNum > 0 && itemsSubtotal > 0 && (
              <span className="text-sm text-slate-500">
                − {new Intl.NumberFormat("ru-RU").format(itemsSubtotal * discountNum / 100)} ₽
              </span>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-400">Комментарий:</label>
          <input
            name="note"
            type="text"
            placeholder="Комментарий"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="admin-form-input text-sm w-96"
          />
        </div>

        {/* Total + Submit */}
        <div className="flex items-center gap-4">
          <FormButton color="green" small>{isEditMode ? "Сохранить изменения" : "Сохранить заказ"}</FormButton>
          {grandTotal > 0 && discountNum > 0 && (
            <div className="text-sm text-slate-400 line-through">
              {new Intl.NumberFormat("ru-RU").format(itemsSubtotal + (parseFloat(deliveryPrice) || 0))} ₽
            </div>
          )}
          {grandTotal > 0 && (
            <div className="text-sm text-slate-600">
              Итого: <span className="font-medium">{new Intl.NumberFormat("ru-RU").format(grandTotal)} ₽</span>
            </div>
          )}
          {formState.errors?._form && (
            <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
          )}
        </div>

      </form>
  );

  if (isEditMode) {
    return (
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pt-3 pb-2 bg-white">{formContent}</div>
        </div>
      </div>
    );
  }

  return (
    <CollapsibleAddSection label="Создать новый заказ" success={!!formState.success} showLabel>
      {formContent}
    </CollapsibleAddSection>
  );
}
