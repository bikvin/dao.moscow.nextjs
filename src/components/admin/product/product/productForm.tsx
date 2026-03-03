"use client";
import { useFormState } from "react-dom";

import FormButton from "@/components/common/formButton/formButton";
import {
  ProductGroup,
  ProductStatusEnum,
  ProductVariant,
} from "@prisma/client";
import { ProductGroupSelect } from "../productGroupSelect";

import { ProductStatusRadio } from "./productStatusRadio";
import ProductVariantsSection from "./ProductVariantsSection";

import { v4 as uuid } from "uuid";
import { useState } from "react";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import { createProduct } from "@/actions/product/product/create";
import { updateProduct } from "@/actions/product/product/update";
import DropzoneInputMultipleImages from "../../images/dropzone/dropzoneInputMultipleImages";
import { ImageObj } from "../../images/edit/ImageObjInterface";

const SELECTED_IMAGES = 1;
const MAX_IMAGES = 20;

export default function ProductForm({
  id,
  sku,
  descriptionShort,
  descriptionLong,
  imageGroupName,
  status,
  productGroupId,
  displayOrder,
  length_mm,
  width_mm,
  thickness_mm,
  productGroups,
  imageData = [],
  productVariants,
  isEdit = false,
}: {
  id?: string;
  sku?: string;
  descriptionShort?: string;
  descriptionLong?: string;
  imageGroupName?: string;
  status?: ProductStatusEnum;
  productGroupId?: string;
  displayOrder?: number;
  length_mm?: number;
  width_mm?: number;
  thickness_mm?: number;
  productGroups: ProductGroup[];
  imageData?: ImageObj[];
  productVariants?: ProductVariant[];
  isEdit?: boolean;
}) {
  const usedAction = isEdit ? updateProduct : createProduct;

  const [imageGroup] = useState(imageGroupName || uuid());
  const [selectedProductGroupId, setSelectedProductGroupId] = useState(
    productGroupId || ""
  );
  const [productStatus, setProductStatus] = useState(
    status || ProductStatusEnum.ACTIVE
  );
  const [photoNames, setPhotoNames] = useState(imageData);

  const [formState, action] = useFormState(usedAction, {
    errors: {},
  });

  return (
    <form className={"admin-form"} action={action}>
      <div className="form-item">
        <label htmlFor="name">Название товара (sku)</label>

        <input
          className="admin-form-input"
          name="sku"
          type="text"
          defaultValue={isEdit ? sku : ""}
        ></input>

        <FormFieldError errors={formState.errors?.sku} />
      </div>
      <div className="form-item">
        <label htmlFor="name">Короткое описание</label>

        <input
          className="admin-form-input"
          name="descriptionShort"
          type="text"
          defaultValue={isEdit ? descriptionShort : ""}
        ></input>

        <FormFieldError errors={formState.errors?.descriptionShort} />
      </div>
      <div className="form-item">
        <label htmlFor="name">Длинное описание</label>

        <textarea
          className="admin-form-input"
          name="descriptionLong"
          defaultValue={isEdit ? descriptionLong : ""}
        ></textarea>

        <FormFieldError errors={formState.errors?.descriptionLong} />
      </div>
      <div className="form-item">
        <label htmlFor="">Группа товаров</label>
        <ProductGroupSelect
          id={selectedProductGroupId}
          setId={setSelectedProductGroupId}
          productGroups={productGroups}
        />

        <FormFieldError errors={formState.errors?.productGroupId} />
      </div>

      <div className="form-item">
        <label htmlFor="">Загрузите картинки</label>
        <DropzoneInputMultipleImages
          photoNames={photoNames}
          setPhotoNames={setPhotoNames}
          dirName={imageGroup}
          selectedImages={SELECTED_IMAGES}
          maxImages={MAX_IMAGES}
        />
      </div>
      <FormFieldError errors={formState.errors?.imagesArrString} />

      <div className="form-item">
        <label>Размеры (мм)</label>
        <div className="flex gap-4">
          <div>
            <label className="text-sm text-slate-500">Длина</label>
            <input
              className="admin-form-input w-24"
              name="length_mm"
              type="number"
              defaultValue={isEdit ? length_mm || "" : ""}
            />
            <FormFieldError errors={formState.errors?.length_mm} />
          </div>
          <div>
            <label className="text-sm text-slate-500">Ширина</label>
            <input
              className="admin-form-input w-24"
              name="width_mm"
              type="number"
              defaultValue={isEdit ? width_mm || "" : ""}
            />
            <FormFieldError errors={formState.errors?.width_mm} />
          </div>
          <div>
            <label className="text-sm text-slate-500">Толщина</label>
            <input
              className="admin-form-input w-24"
              name="thickness_mm"
              type="number"
              defaultValue={isEdit ? thickness_mm || "" : ""}
            />
            <FormFieldError errors={formState.errors?.thickness_mm} />
          </div>
        </div>
      </div>

      <div className="form-item">
        <label htmlFor="">Статус</label>
        <ProductStatusRadio
          status={productStatus}
          setStatus={setProductStatus}
        />
        <FormFieldError errors={formState.errors?.status} />
      </div>
      <div className="form-item">
        <label htmlFor="displayOrder">Порядок показа</label>
        <div className="w-16">
          <input
            className="border border-slate-600 rounded block"
            name="displayOrder"
            type="number"
            defaultValue={isEdit ? displayOrder || "" : ""}
          ></input>
        </div>

        <FormFieldError errors={formState.errors?.displayOrder} />
      </div>

      {isEdit && id && (
        <ProductVariantsSection
          productId={id}
          productVariants={productVariants}
        />
      )}

      <FormButton>
        {!isEdit ? "Создать товар" : "Редактировать товар"}
      </FormButton>

      <input type="hidden" name="imageGroupName" value={imageGroup} />
      <input
        type="hidden"
        name="productGroupId"
        value={selectedProductGroupId}
      />
      <input type="hidden" name="status" value={productStatus} />
      <input
        type="hidden"
        name="imagesArrString"
        value={JSON.stringify(photoNames)}
      />

      <FormFieldError errors={formState.errors?._form} />
      {isEdit && <input type="hidden" name="id" value={id} />}
    </form>
  );
}
