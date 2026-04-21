"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { createOrder } from "@/actions/order/orders";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "@/components/admin/partner/CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";
import { OrderTypeEnum, PriceUnitEnum, CurrencyEnum } from "@prisma/client";
import { X } from "lucide-react";
import { type ProductOption } from "./AddOrderItemForm";
import { PartnerCombobox } from "./PartnerCombobox";

type Option = { id: string; name: string };
type PartnerOption = { id: string; names: string[] };

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
}: {
  item: ItemState;
  products: ProductOption[];
  onChange: (update: Partial<ItemState>) => void;
  onRemove: () => void;
}) {
  const selectedProduct = products.find((p) => p.id === item.productId);
  const availableVariants = selectedProduct?.productVariants ?? [];

  const quantityM2 =
    selectedProduct && item.quantity
      ? (selectedProduct.length_mm * selectedProduct.width_mm * (parseInt(item.quantity) || 0)) /
        1_000_000
      : null;

  const priceRubNum = parseFloat(item.priceRub) || 0;
  const previewTotal =
    item.priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
      ? quantityM2 * priceRubNum
      : (parseInt(item.quantity) || 0) * priceRubNum;

  return (
    <div className="flex flex-wrap items-end gap-2 pl-2 border-l-2 border-slate-200">
      <Field label="Товар">
        <select
          name="productId"
          value={item.productId}
          onChange={(e) => onChange({ productId: e.target.value, variantId: "" })}
          className="admin-form-input text-sm w-44"
        >
          <option value="">— выберите —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.sku}</option>
          ))}
        </select>
      </Field>

      <Field label="Партия">
        <select
          name="productVariantId"
          value={item.variantId}
          onChange={(e) => onChange({ variantId: e.target.value })}
          className="admin-form-input text-sm w-36"
          disabled={availableVariants.length === 0}
        >
          <option value="">— партия —</option>
          {availableVariants.map((v) => (
            <option key={v.id} value={v.id}>{v.variantName}</option>
          ))}
        </select>
      </Field>

      <Field label="Кол-во">
        <input
          name="quantity"
          type="number"
          placeholder="0"
          value={item.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          className="admin-form-input text-sm w-20"
          min="1"
        />
      </Field>

      {quantityM2 !== null && (
        <Field label="М²">
          <div className="text-sm py-1 px-2 bg-slate-100 rounded w-20 text-right border border-slate-200">
            {quantityM2.toFixed(2)}
          </div>
        </Field>
      )}
      <input type="hidden" name="quantityM2" value={quantityM2 !== null ? quantityM2.toFixed(6) : ""} />

      <Field label="Ед.">
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

      <Field label="Цена">
        <input
          name="price"
          type="number"
          placeholder="0"
          value={item.price}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ price: v, ...(item.currency === CurrencyEnum.RUB && { priceRub: v }) });
          }}
          className="admin-form-input text-sm w-28"
          min="0"
          step="0.01"
        />
      </Field>

      <Field label="Валюта">
        <select
          name="priceCurrency"
          value={item.currency}
          onChange={(e) => {
            const c = e.target.value as CurrencyEnum;
            onChange({ currency: c, priceRub: c === CurrencyEnum.RUB ? item.price : "" });
          }}
          className="admin-form-input text-sm w-20"
        >
          {Object.values(CurrencyEnum).map((c) => (
            <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
          ))}
        </select>
      </Field>

      {item.currency !== CurrencyEnum.RUB && (
        <Field label="Цена (₽)">
          <input
            name="priceRub"
            type="number"
            placeholder="0"
            value={item.priceRub}
            onChange={(e) => onChange({ priceRub: e.target.value })}
            className="admin-form-input text-sm w-28"
            min="0"
            step="0.01"
          />
        </Field>
      )}
      {item.currency === CurrencyEnum.RUB && (
        <input type="hidden" name="priceRub" value={item.price} />
      )}

      <Field label="Итого">
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
}: {
  partners: PartnerOption[];
  deliveryMethods: Option[];
  paymentMethods: Option[];
  products: ProductOption[];
}) {
  const [formState, action] = useFormState<SubItemFormState, FormData>(createOrder, {});
  const [partnerId, setPartnerId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [orderType, setOrderType] = useState<OrderTypeEnum>(OrderTypeEnum.SALE);
  const [deliveryMethodId, setDeliveryMethodId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ItemState[]>([]);

  useEffect(() => {
    if (formState.success) {
      setPartnerId("");
      setOrderDate(new Date().toISOString().split("T")[0]);
      setOrderType(OrderTypeEnum.SALE);
      setDeliveryMethodId("");
      setPaymentMethodId("");
      setNote("");
      setItems([]);
    }
  }, [formState.success]);

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateRow = (id: string, update: Partial<ItemState>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...update } : i)));

  return (
    <CollapsibleAddSection label="Создать новый заказ" success={!!formState.success} showLabel>
      <form action={action} className="flex flex-col gap-3">

        {/* Order header fields */}
        <div className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="partnerId" value={partnerId} />
          <PartnerCombobox
            partners={partners}
            value={partnerId}
            onChange={setPartnerId}
          />
          <input
            name="orderDate"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="admin-form-input text-sm w-36"
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
          <select
            name="deliveryMethodId"
            value={deliveryMethodId}
            onChange={(e) => setDeliveryMethodId(e.target.value)}
            className="admin-form-input text-sm w-44"
          >
            <option value="">— способ доставки —</option>
            {deliveryMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            name="paymentMethodId"
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
            className="admin-form-input text-sm w-44"
          >
            <option value="">— способ оплаты —</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input
            name="note"
            type="text"
            placeholder="Комментарий"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="admin-form-input text-sm w-56"
          />
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
              />
            ))}
          </div>
        )}

        {/* Add product row + submit */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-blue-500 hover:underline"
          >
            Добавить товар
          </button>
          <FormButton color="green" small>Сохранить заказ</FormButton>
          {formState.errors?._form && (
            <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
          )}
        </div>

      </form>
    </CollapsibleAddSection>
  );
}
