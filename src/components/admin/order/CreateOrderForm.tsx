"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { createOrder } from "@/actions/order/orders";
import { updateOrder } from "@/actions/order/updateOrder";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "@/components/admin/partner/CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";
import { OrderTypeEnum, PriceTypeEnum, PriceUnitEnum, CurrencyEnum } from "@prisma/client";
import { X } from "lucide-react";
import { type ProductOption } from "./AddOrderItemForm";
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
  deliveryMethodId: string | null;
  deliveryPriceRub: number;
  paymentMethodId: string | null;
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
};

const ORDER_TYPE_LABELS: Record<OrderTypeEnum, string> = {
  SALE: "Продажа",
  RETURN: "Возврат",
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
  const selectedProduct = products.find((p) => p.id === item.productId);
  const availableVariants = selectedProduct?.productVariants ?? [];

  const quantityM2 =
    selectedProduct && item.quantity
      ? (selectedProduct.length_mm * selectedProduct.width_mm * (parseInt(item.quantity) || 0)) /
        1_000_000
      : null;

  const effectivePriceRub = item.currency === CurrencyEnum.RUB ? item.price : item.priceRub;
  const priceRubNum = parseFloat(effectivePriceRub) || 0;
  const previewTotal =
    item.priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
      ? quantityM2 * priceRubNum
      : (parseInt(item.quantity) || 0) * priceRubNum;

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
          onChange={(e) => onChange({ quantity: e.target.value })}
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
            onChange({ price: v, priceRub });
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
                    const priceNum = parseFloat(val);
                    let rubPrice = "";
                    if (p.currency === CurrencyEnum.RUB) {
                      rubPrice = val;
                    } else if (p.currency === CurrencyEnum.USD && usdRate != null) {
                      rubPrice = (priceNum * usdRate).toFixed(2);
                    } else if (p.currency === CurrencyEnum.RMB && rmbRate != null) {
                      rubPrice = (priceNum * rmbRate).toFixed(2);
                    }
                    onChange({ price: val, currency: p.currency, priceRub: rubPrice, priceUnit: p.unit });
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
            onChange({ currency: c, priceRub });
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
          onChange={(e) => onChange({ priceUnit: e.target.value as PriceUnitEnum })}
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
            onChange={(e) => onChange({ priceRub: e.target.value })}
            className={`admin-form-input text-sm w-28 ${touched && !(parseFloat(item.priceRub) > 0) ? "border-red-500" : ""}`}
            min="0"
            step="0.01"
          />
        </Field>
      ) : (
        <>
          {item.price && (
            <Field label="Цена (₽):">
              <div className="text-sm py-1 px-2 bg-slate-100 rounded w-28 text-right border border-slate-200">
                {item.price}
              </div>
            </Field>
          )}
          <input type="hidden" name="priceRub" value={item.price} />
        </>
      )}

      <Field label="Итого:">
        <div className="text-sm py-1 px-2 bg-slate-100 rounded w-28 text-right border border-slate-200">
          {previewTotal > 0
            ? new Intl.NumberFormat("ru-RU").format(previewTotal) + " ₽"
            : "—"}
        </div>
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
}: {
  partners: PartnerOption[];
  deliveryMethods: DeliveryMethodOption[];
  paymentMethods: Option[];
  products: ProductOption[];
  usdRate: number | null;
  rmbRate: number | null;
  initialOrder?: InitialOrder;
}) {
  const isEditMode = !!initialOrder;
  const boundAction = isEditMode ? updateOrder.bind(null, initialOrder.id) : createOrder;
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [isOpen, setIsOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [partnerId, setPartnerId] = useState(initialOrder?.partnerId ?? "");
  const [orderDate, setOrderDate] = useState(
    initialOrder
      ? new Date(initialOrder.orderDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [orderType, setOrderType] = useState<OrderTypeEnum>(initialOrder?.orderType ?? OrderTypeEnum.SALE);
  const [deliveryMethodId, setDeliveryMethodId] = useState(initialOrder?.deliveryMethodId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(initialOrder?.paymentMethodId ?? "");
  const [deliveryPrice, setDeliveryPrice] = useState(
    initialOrder?.deliveryPriceRub ? (initialOrder.deliveryPriceRub / 100).toString() : ""
  );
  const [discount, setDiscount] = useState(
    initialOrder?.discountPercent ? initialOrder.discountPercent.toString() : ""
  );
  const [note, setNote] = useState(initialOrder?.note ?? "");
  const [items, setItems] = useState<ItemState[]>(
    initialOrder?.items.length
      ? initialOrder.items.map((item) => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          variantId: item.productVariantId,
          quantity: item.quantity.toString(),
          priceUnit: item.priceUnit,
          price: (item.priceInCents / 100).toString(),
          currency: item.priceCurrency,
          priceRub: (item.priceRub / 100).toString(),
        }))
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
        setDeliveryMethodId("");
        setPaymentMethodId("");
        setDeliveryPrice("");
        setDiscount("");
        setNote("");
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="orderDate"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="admin-form-input text-sm w-36"
          />
          <input type="hidden" name="partnerId" value={partnerId} />
          <PartnerCombobox
            partners={partners}
            value={partnerId}
            onChange={setPartnerId}
            error={touched && !partnerId}
          />
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

        {/* Delivery */}
        <div className="flex flex-wrap items-start gap-4">
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

        {/* Payment */}
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
            className="admin-form-input text-sm w-56"
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
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="text-sm text-blue-500 hover:underline"
        >
          {isOpen ? "Свернуть" : "Редактировать"}
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="pt-3">{formContent}</div>
          </div>
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
