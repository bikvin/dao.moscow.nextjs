"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import FormButton from "@/components/common/formButton/formButton";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import { ProductSelect } from "@/components/admin/product/productSelect";
import { MappingFormState, createYandexMapping } from "@/actions/yandex/mapping/create";
import { updateYandexMapping } from "@/actions/yandex/mapping/update";
import { Product } from "@prisma/client";

export function YandexMappingForm({
  id,
  products,
  productId: initialProductId,
  yandexSku,
  buffer,
  divisor,
  priceMarkup,
  isEdit = false,
}: {
  id?: string;
  products: Product[];
  productId?: string;
  yandexSku?: string;
  buffer?: number | null;
  divisor?: number | null;
  priceMarkup?: number | null;
  isEdit?: boolean;
}) {
  const action = isEdit ? updateYandexMapping : createYandexMapping;
  const [formState, formAction] = useFormState<MappingFormState, FormData>(action, { errors: {} });
  const [selectedProductId, setSelectedProductId] = useState(initialProductId ?? "");

  return (
    <form className="admin-form" action={formAction}>
      <div className="form-item">
        <label>Товар</label>
        <ProductSelect id={selectedProductId} setId={setSelectedProductId} products={products} />
        <input type="hidden" name="productId" value={selectedProductId} />
        <FormFieldError errors={formState.errors?.productId} />
      </div>
      <div className="form-item">
        <label>SKU на Яндекс Маркете</label>
        <input
          name="yandexSku"
          className="admin-form-input"
          defaultValue={yandexSku ?? ""}
        />
        <FormFieldError errors={formState.errors?.yandexSku} />
      </div>
      <div className="form-item">
        <label>Индивидуальный буфер (шт., необязательно)</label>
        <div className="w-20">
          <input
            name="buffer"
            type="number"
            min={0}
            className="admin-form-input"
            defaultValue={buffer ?? ""}
            placeholder="—"
          />
        </div>
        <FormFieldError errors={formState.errors?.buffer} />
      </div>
      <div className="form-item">
        <label>Индивидуальный делитель (необязательно)</label>
        <div className="w-20">
          <input
            name="divisor"
            type="number"
            min={1}
            className="admin-form-input"
            defaultValue={divisor ?? ""}
            placeholder="—"
          />
        </div>
        <FormFieldError errors={formState.errors?.divisor} />
      </div>
      <div className="form-item">
        <label>Индивидуальная наценка к цене, % (необязательно)</label>
        <div className="w-20">
          <input
            name="priceMarkup"
            type="number"
            className="admin-form-input"
            defaultValue={priceMarkup ?? ""}
            placeholder="—"
          />
        </div>
        <FormFieldError errors={formState.errors?.priceMarkup} />
      </div>
      {isEdit && <input type="hidden" name="id" value={id} />}
      <FormButton>{isEdit ? "Сохранить" : "Создать"}</FormButton>
      <FormFieldError errors={formState.errors?._form} />
    </form>
  );
}
