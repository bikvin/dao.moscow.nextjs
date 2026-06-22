"use client";
import { useFormState } from "react-dom";

import FormButton from "@/components/common/formButton/formButton";

import { useState } from "react";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import { ProductSelect } from "../productSelect";
import { ProductVariantSelect } from "./ProductVariantSelect";

import CalendarFormInput from "@/components/common/CalendarFormInput";
import { CurrencyEnum, PriceUnitEnum, ProductReceiptTypeEnum } from "@prisma/client";
import { TypeRadio } from "./ProductReceiptTypeRadio";
import { createProductReceipt } from "@/actions/product/product-receipt/create";
import { updateProductReceipt } from "@/actions/product/product-receipt/update";
import { ProductWithVariants } from "@/types/product/productWithVariants";

export function ProductReceiptForm({
  id,
  productId,
  productVariantId,
  products,
  quantity,
  description,
  receiptDate,
  receiptType,
  order,
  price,
  priceCurrency,
  priceUnit,
  isEdit = false,
}: {
  id?: string;
  productId?: string;
  productVariantId?: string;
  products: ProductWithVariants[];
  quantity?: number;
  description?: string | null;
  receiptDate?: Date;
  receiptType?: ProductReceiptTypeEnum;
  order?: { year: number; sequenceNumber: number } | null;
  price?: number | null;
  priceCurrency?: CurrencyEnum | null;
  priceUnit?: PriceUnitEnum | null;
  isEdit?: boolean;
}) {
  const usedAction = isEdit ? updateProductReceipt : createProductReceipt;

  const [selectedProductId, setSelectedProductId] = useState(productId || "");
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    if (productVariantId) return productVariantId;
    const product = products.find((p) => p.id === productId);
    const vs = product?.productVariants ?? [];
    return vs.length === 1 ? vs[0].id : "";
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const variants = selectedProduct?.productVariants || [];

  const handleProductChange = (newProductId: string) => {
    setSelectedProductId(newProductId);
    const newVariants = products.find((p) => p.id === newProductId)?.productVariants || [];
    setSelectedVariantId(newVariants.length === 1 ? newVariants[0].id : "");
  };
  const [selectedReceiptDate, setSelectedReceiptDate] = useState<
    Date | undefined
  >(receiptDate || new Date());
  const [type, setType] = useState<ProductReceiptTypeEnum>(
    receiptType || ProductReceiptTypeEnum.RETURN,
  );
  const [priceValue, setPriceValue] = useState(price != null ? price.toString() : "");
  const [currency, setCurrency] = useState<CurrencyEnum>(priceCurrency ?? CurrencyEnum.USD);
  const [unit, setUnit] = useState<PriceUnitEnum>(priceUnit ?? PriceUnitEnum.M2);

  const [formState, action] = useFormState(usedAction, {
    errors: {},
  });

  function toIsoDateAtNoon(date: Date) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  }

  return (
    <form className={"admin-form"} action={action}>
      {order && (
        <div className="form-item">
          <label>Заказ</label>
          <span className="text-sm text-slate-600">
            №{order.sequenceNumber}/{order.year}
          </span>
        </div>
      )}
      <div className="form-item">
        <label htmlFor="">Товар</label>
        <ProductSelect
          id={selectedProductId}
          setId={handleProductChange}
          products={products}
        />
      </div>
      <div className="form-item">
        <label htmlFor="">Вариант</label>
        <ProductVariantSelect
          key={selectedProductId}
          variants={variants}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
          disabled={!selectedProductId}
        />
        <FormFieldError errors={formState.errors?.productVariantId} />
      </div>
      <div className="form-item">
        <label htmlFor="name">Количество шт.</label>
        <div className="w-16">
          <input
            className="admin-form-input"
            name="quantity"
            type="number"
            defaultValue={isEdit ? quantity : ""}
          ></input>
        </div>
        <FormFieldError errors={formState.errors?.quantity} />
      </div>
      <div className="form-item">
        <CalendarFormInput
          label="Дата поставки"
          date={selectedReceiptDate}
          setDate={setSelectedReceiptDate}
        />
        <FormFieldError errors={formState.errors?.receiptDate} />
      </div>
      <div className="form-item">
        <label htmlFor="">Тип</label>
        <TypeRadio
          type={type}
          setType={setType}
          options={[
            { value: ProductReceiptTypeEnum.RETURN, label: "Возврат товара" },
            { value: ProductReceiptTypeEnum.SHIPMENT, label: "Новая поставка" },
            {
              value: ProductReceiptTypeEnum.CORRECTION,
              label: "Коррекция остатка",
            },
            { value: ProductReceiptTypeEnum.OTHER, label: "Другое" },
          ]}
        />
        <FormFieldError errors={formState.errors?.type} />
      </div>
      <div className="form-item">
        <label htmlFor="name">Описание</label>

        <input
          className="admin-form-input"
          name="description"
          type="text"
          defaultValue={isEdit && description ? description : ""}
        ></input>

        <FormFieldError errors={formState.errors?.description} />
      </div>

      <div className="form-item">
        <label>Цена закупки</label>
        <div className="flex items-center gap-2">
          <input
            className="admin-form-input w-32"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="не указана"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
          />
          <select
            name="priceCurrency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyEnum)}
            className="admin-form-input w-20"
          >
            <option value={CurrencyEnum.RUB}>₽</option>
            <option value={CurrencyEnum.USD}>$</option>
            <option value={CurrencyEnum.RMB}>¥</option>
          </select>
          <select
            name="priceUnit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as PriceUnitEnum)}
            className="admin-form-input w-20"
          >
            <option value={PriceUnitEnum.ITEM}>шт</option>
            <option value={PriceUnitEnum.M2}>м²</option>
          </select>
        </div>
        <FormFieldError errors={formState.errors?.price} />
      </div>

      <FormButton>
        {!isEdit ? "Создать поставку" : "Редактировать поставку"}
      </FormButton>
      <FormFieldError errors={formState.errors?._form} />
      {isEdit && <input type="hidden" name="id" value={id} />}
      <FormFieldError errors={formState.errors?.id} />
      <input type="hidden" name="productVariantId" value={selectedVariantId} />
      <input
        type="hidden"
        name="receiptDate"
        value={selectedReceiptDate ? toIsoDateAtNoon(selectedReceiptDate) : ""}
      />
      <input type="hidden" name="type" value={type} />
    </form>
  );
}
