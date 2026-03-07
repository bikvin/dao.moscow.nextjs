"use client";
import { useFormState } from "react-dom";

import FormButton from "@/components/common/formButton/formButton";

import { useState } from "react";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import { ProductSelect } from "../productSelect";
import { ProductVariantSelect } from "../product-receipt/ProductVariantSelect";

import CalendarFormInput from "@/components/common/CalendarFormInput";
import { ProductReserveStatusEnum } from "@prisma/client";
import { TypeRadio } from "../product-receipt/ProductReceiptTypeRadio";
import { createProductReserve } from "@/actions/product/product-reserve/create";
import { updateProductReserve } from "@/actions/product/product-reserve/update";
import { ProductWithVariants } from "@/types/product/productWithVariants";

export function ProductReserveForm({
  id,
  productId,
  productVariantId,
  products,
  quantity,
  reserveDate,
  client,
  status,
  isEdit = false,
}: {
  id?: string;
  productId?: string;
  productVariantId?: string;
  products: ProductWithVariants[];
  quantity?: number;
  reserveDate?: Date;
  client?: string;
  status?: ProductReserveStatusEnum;
  isEdit?: boolean;
}) {
  const usedAction = isEdit ? updateProductReserve : createProductReserve;

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

  const [selectedReserveDate, setSelectedReserveDate] = useState<
    Date | undefined
  >(reserveDate || new Date());

  const [selectedStatus, setSelectedStatus] = useState<ProductReserveStatusEnum>(
    status || ProductReserveStatusEnum.ACTIVE
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
    <form className="admin-form" action={action}>
      <div className="form-item">
        <label>Товар</label>
        <ProductSelect
          id={selectedProductId}
          setId={handleProductChange}
          products={products}
        />
      </div>
      <div className="form-item">
        <label>Вариант</label>
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
        <label>Количество шт.</label>
        <div className="w-16">
          <input
            className="admin-form-input"
            name="quantity"
            type="number"
            defaultValue={isEdit ? quantity : ""}
          />
        </div>
        <FormFieldError errors={formState.errors?.quantity} />
      </div>
      <div className="form-item">
        <CalendarFormInput
          label="Дата резерва"
          date={selectedReserveDate}
          setDate={setSelectedReserveDate}
        />
        <FormFieldError errors={formState.errors?.reserveDate} />
      </div>
      <div className="form-item">
        <label>Клиент</label>
        <input
          className="admin-form-input"
          name="client"
          type="text"
          defaultValue={isEdit && client ? client : ""}
        />
        <FormFieldError errors={formState.errors?.client} />
      </div>
      <div className="form-item">
        <label>Статус</label>
        <TypeRadio
          type={selectedStatus}
          setType={setSelectedStatus}
          options={[
            { value: ProductReserveStatusEnum.ACTIVE, label: "Активен" },
            { value: ProductReserveStatusEnum.FULFILLED, label: "Выполнен" },
            { value: ProductReserveStatusEnum.CANCELLED, label: "Отменён" },
          ]}
        />
        <FormFieldError errors={formState.errors?.status} />
      </div>
      <FormButton>
        {!isEdit ? "Создать резерв" : "Редактировать резерв"}
      </FormButton>
      <FormFieldError errors={formState.errors?._form} />
      {isEdit && <input type="hidden" name="id" value={id} />}
      <FormFieldError errors={formState.errors?.id} />
      <input type="hidden" name="productVariantId" value={selectedVariantId} />
      <input
        type="hidden"
        name="reserveDate"
        value={selectedReserveDate ? toIsoDateAtNoon(selectedReserveDate) : ""}
      />
      <input type="hidden" name="status" value={selectedStatus} />
    </form>
  );
}
