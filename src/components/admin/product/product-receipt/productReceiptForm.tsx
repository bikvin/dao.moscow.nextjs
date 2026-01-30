"use client";
import { useFormState } from "react-dom";

import FormButton from "@/components/common/formButton/formButton";

import { useState } from "react";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import { Product } from "@prisma/client";
import { ProductSelect } from "../productSelect";

import CalendarFormInput from "@/components/common/CalendarFormInput";
import { ProductReceiptTypeEnum } from "@prisma/client";
import { ProductReceiptTypeRadio } from "./ProductReceiptTypeRadio";
import { createProductReceipt } from "@/actions/product/product-receipt/create";
import { updateProductReceipt } from "@/actions/product/product-receipt/update";

export function ProductReceiptForm({
  id,
  productId,
  products,
  quantity,
  description,
  receiptDate,
  receiptType,

  isEdit = false,
}: {
  id?: string;
  productId?: string;
  products: Product[];
  quantity?: number;
  description?: string | null;
  receiptDate?: Date;
  receiptType?: ProductReceiptTypeEnum;
  displayOrder?: number;
  isEdit?: boolean;
}) {
  const usedAction = isEdit ? updateProductReceipt : createProductReceipt;

  const [selectedProductId, setSelectedProductId] = useState(productId || "");
  const [selectedReceiptDate, setSelectedReceiptDate] = useState<
    Date | undefined
  >(receiptDate || new Date());
  const [type, setType] = useState<ProductReceiptTypeEnum>(
    receiptType || ProductReceiptTypeEnum.SHIPMENT
  );

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
      <div className="form-item">
        <label htmlFor="">Товар</label>
        <ProductSelect
          id={selectedProductId}
          setId={setSelectedProductId}
          products={products}
        />

        <FormFieldError errors={formState.errors?.productId} />
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
        <ProductReceiptTypeRadio type={type} setType={setType} />
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
      <FormButton>
        {!isEdit ? "Создать поставку" : "Редактировать поставку"}
      </FormButton>
      <FormFieldError errors={formState.errors?._form} />
      {isEdit && <input type="hidden" name="id" value={id} />}
      <FormFieldError errors={formState.errors?.id} />
      //// change to productVariont
      <input type="hidden" name="productId" value={selectedProductId} />
      <input
        type="hidden"
        name="receiptDate"
        value={selectedReceiptDate ? toIsoDateAtNoon(selectedReceiptDate) : ""}
      />
      <input type="hidden" name="type" value={type} />
    </form>
  );
}
