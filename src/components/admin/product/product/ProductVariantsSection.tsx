"use client";

import { useState } from "react";
import { ProductVariant } from "@prisma/client";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import {
  createVariant,
  VariantFormState,
} from "@/actions/product/product-variant/create";
import { deleteVariant } from "@/actions/product/product-variant/delete";
import DeleteDialog from "@/components/common/delete/DeleteDialog";

interface ProductVariantsSectionProps {
  productId: string;
  productVariants?: ProductVariant[];
}

export default function ProductVariantsSection({
  productId,
  productVariants,
}: ProductVariantsSectionProps) {
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantName, setVariantName] = useState("");
  const [variantErrors, setVariantErrors] = useState<VariantFormState["errors"]>(
    {}
  );

  const handleCreateVariant = async () => {
    const formData = new FormData();
    formData.append("variantName", variantName);
    formData.append("productId", productId);

    const result = await createVariant({ errors: {} }, formData);

    if (Object.keys(result.errors).length > 0) {
      setVariantErrors(result.errors);
      return;
    }

    setVariantErrors({});
    setVariantName("");
    setShowVariantForm(false);
  };

  return (
    <div className="form-item">
      <h4 className="mb-2">Варианты:</h4>
      <ul className="space-y-1">
        {productVariants &&
          productVariants.map((productVariant, index) => (
            <li
              key={productVariant.id}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {index + 1}. {productVariant.variantName}
              </span>
              <DeleteDialog
                id={productVariant.id}
                action={deleteVariant}
                message={`Вы уверены, что хотите удалить вариант "${productVariant.variantName}"?`}
              />
            </li>
          ))}
      </ul>
      {showVariantForm ? (
        <div className="mt-3 p-3 border border-slate-300 rounded">
          <input
            className="admin-form-input mb-2"
            placeholder="Название варианта"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
          />
          <FormFieldError errors={variantErrors?.variantName} />
          <FormFieldError errors={variantErrors?._form} />
          <div className="flex gap-2">
            <button
              type="button"
              className="link-button link-button-blue"
              onClick={handleCreateVariant}
            >
              Сохранить
            </button>
            <button
              type="button"
              className="link-button link-button-gray"
              onClick={() => {
                setShowVariantForm(false);
                setVariantErrors({});
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setShowVariantForm(true)}
          className="mt-2 text-sm text-blue-700 underline cursor-pointer hover:text-blue-900"
        >
          Добавить вариант
        </div>
      )}
    </div>
  );
}
