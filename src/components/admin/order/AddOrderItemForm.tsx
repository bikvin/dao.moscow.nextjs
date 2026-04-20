"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addOrderItem } from "@/actions/order/orderItems";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "@/components/admin/partner/CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";
import { PriceUnitEnum, CurrencyEnum } from "@prisma/client";

export type ProductOption = {
  id: string;
  sku: string;
  length_mm: number;
  width_mm: number;
  productVariants: { id: string; variantName: string }[];
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

export function AddOrderItemForm({
  orderId,
  products,
}: {
  orderId: string;
  products: ProductOption[];
}) {
  const boundAction = addOrderItem.bind(null, orderId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priceUnit, setPriceUnit] = useState<PriceUnitEnum>(PriceUnitEnum.M2);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<CurrencyEnum>(CurrencyEnum.RUB);
  const [priceRub, setPriceRub] = useState("");

  useEffect(() => {
    if (formState.success) {
      setProductId(""); setVariantId(""); setQuantity("");
      setPriceUnit(PriceUnitEnum.M2); setPrice("");
      setCurrency(CurrencyEnum.RUB); setPriceRub("");
    }
  }, [formState.success]);

  const selectedProduct = products.find((p) => p.id === productId);
  const availableVariants = selectedProduct?.productVariants ?? [];

  const quantityM2 =
    selectedProduct && quantity
      ? (selectedProduct.length_mm * selectedProduct.width_mm * (parseInt(quantity) || 0)) / 1_000_000
      : null;

  const priceRubNum = parseFloat(priceRub) || 0;
  const previewTotal =
    priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
      ? quantityM2 * priceRubNum
      : (parseInt(quantity) || 0) * priceRubNum;

  const handlePriceChange = (v: string) => {
    setPrice(v);
    if (currency === CurrencyEnum.RUB) setPriceRub(v);
  };

  const handleCurrencyChange = (v: CurrencyEnum) => {
    setCurrency(v);
    if (v === CurrencyEnum.RUB) setPriceRub(price);
    else setPriceRub("");
  };

  const handleProductChange = (v: string) => {
    setProductId(v);
    setVariantId("");
  };

  return (
    <CollapsibleAddSection label="Добавить товар" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-end gap-2">

        <Field label="Товар">
          <select
            name="productId"
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
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
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
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
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
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
            value={priceUnit}
            onChange={(e) => setPriceUnit(e.target.value as PriceUnitEnum)}
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
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="admin-form-input text-sm w-28"
            min="0"
            step="0.01"
          />
        </Field>

        <Field label="Валюта">
          <select
            name="priceCurrency"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as CurrencyEnum)}
            className="admin-form-input text-sm w-20"
          >
            {Object.values(CurrencyEnum).map((c) => (
              <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
            ))}
          </select>
        </Field>

        {currency !== CurrencyEnum.RUB && (
          <Field label="Цена (₽)">
            <input
              name="priceRub"
              type="number"
              placeholder="0"
              value={priceRub}
              onChange={(e) => setPriceRub(e.target.value)}
              className="admin-form-input text-sm w-28"
              min="0"
              step="0.01"
            />
          </Field>
        )}
        {currency === CurrencyEnum.RUB && (
          <input type="hidden" name="priceRub" value={price} />
        )}

        <Field label="Итого">
          <div className="flex items-center gap-2">
            <div className="text-sm py-1 px-2 bg-slate-100 rounded w-28 text-right border border-slate-200">
              {previewTotal > 0
                ? new Intl.NumberFormat("ru-RU").format(previewTotal) + " ₽"
                : "—"}
            </div>
            <FormButton color="green" small>Добавить</FormButton>
          </div>
        </Field>

        {formState.errors?._form && (
          <div className="w-full text-red-600 text-sm mt-1">
            {formState.errors._form.join(", ")}
          </div>
        )}
      </form>
    </CollapsibleAddSection>
  );
}
