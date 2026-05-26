"use client";

import { useFormState } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { addOrderItem } from "@/actions/order/orderItems";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "@/components/admin/partner/CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";
import { PriceUnitEnum, CurrencyEnum, PriceTypeEnum } from "@prisma/client";
import { ProductCombobox } from "./ProductCombobox";

export type ProductPrice = {
  type: PriceTypeEnum;
  priceInCents: number;
  currency: CurrencyEnum;
  unit: PriceUnitEnum;
};

export type ProductOption = {
  id: string;
  sku: string;
  length_mm: number;
  width_mm: number;
  productVariants: { id: string; variantName: string; isMain: boolean }[];
  prices: ProductPrice[];
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

export function calcTotalFromPriceRub(
  priceRubVal: string,
  qty: string,
  unit: PriceUnitEnum,
  product: ProductOption | undefined,
): string {
  const priceRubNum = parseFloat(priceRubVal) || 0;
  if (!priceRubNum) return "";
  if (unit === PriceUnitEnum.M2 && product && qty) {
    const qM2 = (product.length_mm * product.width_mm * (parseInt(qty) || 0)) / 1_000_000;
    const t = qM2 * priceRubNum;
    return t > 0 ? t.toFixed(2) : "";
  }
  const t = (parseInt(qty) || 0) * priceRubNum;
  return t > 0 ? t.toFixed(2) : "";
}

export function calcPriceRubFromTotal(
  totalVal: string,
  qty: string,
  unit: PriceUnitEnum,
  product: ProductOption | undefined,
): string {
  const totalNum = parseFloat(totalVal) || 0;
  if (!totalNum) return "";
  let effQty: number;
  if (unit === PriceUnitEnum.M2 && product && qty) {
    effQty = (product.length_mm * product.width_mm * (parseInt(qty) || 0)) / 1_000_000;
  } else {
    effQty = parseInt(qty) || 0;
  }
  if (effQty <= 0) return "";
  return (totalNum / effQty).toFixed(2);
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
  const [total, setTotal] = useState("");
  // tracks which field was last edited to determine recalc direction on quantity/unit/product change
  const lastEdited = useRef<"price" | "total">("price");

  useEffect(() => {
    if (formState.success) {
      setProductId(""); setVariantId(""); setQuantity("");
      setPriceUnit(PriceUnitEnum.M2); setPrice("");
      setCurrency(CurrencyEnum.RUB); setPriceRub(""); setTotal("");
      lastEdited.current = "price";
    }
  }, [formState.success]);

  const selectedProduct = products.find((p) => p.id === productId);
  const availableVariants = selectedProduct?.productVariants ?? [];

  const quantityM2 =
    selectedProduct && quantity
      ? (selectedProduct.length_mm * selectedProduct.width_mm * (parseInt(quantity) || 0)) / 1_000_000
      : null;

  const handlePriceChange = (v: string) => {
    lastEdited.current = "price";
    setPrice(v);
    const rubVal = currency === CurrencyEnum.RUB ? v : priceRub;
    if (currency === CurrencyEnum.RUB) setPriceRub(v);
    setTotal(calcTotalFromPriceRub(rubVal, quantity, priceUnit, selectedProduct));
  };

  const handlePriceRubChange = (v: string) => {
    lastEdited.current = "price";
    setPriceRub(v);
    setTotal(calcTotalFromPriceRub(v, quantity, priceUnit, selectedProduct));
  };

  const handleTotalChange = (v: string) => {
    lastEdited.current = "total";
    setTotal(v);
    const calcPriceRub = calcPriceRubFromTotal(v, quantity, priceUnit, selectedProduct);
    setPriceRub(calcPriceRub);
    setCurrency(CurrencyEnum.RUB);
    setPrice(calcPriceRub);
  };

  const handleQuantityChange = (v: string) => {
    setQuantity(v);
    if (lastEdited.current === "total") {
      const calcPriceRub = calcPriceRubFromTotal(total, v, priceUnit, selectedProduct);
      setPriceRub(calcPriceRub);
      setPrice(calcPriceRub);
      if (currency !== CurrencyEnum.RUB) setCurrency(CurrencyEnum.RUB);
    } else {
      const rubVal = currency === CurrencyEnum.RUB ? price : priceRub;
      setTotal(calcTotalFromPriceRub(rubVal, v, priceUnit, selectedProduct));
    }
  };

  const handlePriceUnitChange = (v: PriceUnitEnum) => {
    setPriceUnit(v);
    if (lastEdited.current === "total") {
      const calcPriceRub = calcPriceRubFromTotal(total, quantity, v, selectedProduct);
      setPriceRub(calcPriceRub);
      setPrice(calcPriceRub);
    } else {
      const rubVal = currency === CurrencyEnum.RUB ? price : priceRub;
      setTotal(calcTotalFromPriceRub(rubVal, quantity, v, selectedProduct));
    }
  };

  const handleCurrencyChange = (v: CurrencyEnum) => {
    setCurrency(v);
    if (v === CurrencyEnum.RUB) {
      setPriceRub(price);
      setTotal(calcTotalFromPriceRub(price, quantity, priceUnit, selectedProduct));
      lastEdited.current = "price";
    } else {
      setPriceRub("");
      setTotal("");
    }
  };

  const handleProductChange = (v: string) => {
    setProductId(v);
    const variants = products.find((p) => p.id === v)?.productVariants ?? [];
    setVariantId(variants.length === 1 ? variants[0].id : "");
    const newProduct = products.find((p) => p.id === v);
    if (lastEdited.current === "total") {
      const calcPriceRub = calcPriceRubFromTotal(total, quantity, priceUnit, newProduct);
      setPriceRub(calcPriceRub);
      setPrice(calcPriceRub);
    } else {
      const rubVal = currency === CurrencyEnum.RUB ? price : priceRub;
      setTotal(calcTotalFromPriceRub(rubVal, quantity, priceUnit, newProduct));
    }
  };

  return (
    <CollapsibleAddSection label="Добавить товар" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-end gap-2">

        <Field label="Товар">
          <input type="hidden" name="productId" value={productId} />
          <ProductCombobox
            products={products}
            value={productId}
            onChange={handleProductChange}
          />
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
            onChange={(e) => handleQuantityChange(e.target.value)}
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
            onChange={(e) => handlePriceUnitChange(e.target.value as PriceUnitEnum)}
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
              onChange={(e) => handlePriceRubChange(e.target.value)}
              className="admin-form-input text-sm w-28"
              min="0"
              step="0.01"
            />
          </Field>
        )}
        {currency === CurrencyEnum.RUB && (
          <input type="hidden" name="priceRub" value={priceRub} />
        )}

        <Field label="Итого (₽)">
          <div className="flex items-center gap-2">
            <input
              name="itemTotal"
              type="number"
              placeholder="0"
              value={total}
              onChange={(e) => handleTotalChange(e.target.value)}
              className="admin-form-input text-sm w-28"
              min="0"
              step="0.01"
            />
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
