"use client";
import { useFormState } from "react-dom";

import FormButton from "@/components/common/formButton/formButton";
import {
  Price,
  PriceTypeEnum,
  PriceUnitEnum,
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
  prices = [],
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
  prices?: Price[];
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

  const existingDealerPrice = prices.find((p) => p.type === PriceTypeEnum.DEALER);
  const existingRetailPrice = prices.find((p) => p.type === PriceTypeEnum.RETAIL);

  const [dealerCurrency, setDealerCurrency] = useState<"USD" | "RUB">(
    (existingDealerPrice?.currency as "USD" | "RUB") ?? "USD"
  );
  const [dealerUnit, setDealerUnit] = useState<"M2" | "ITEM">(
    existingDealerPrice?.unit ?? PriceUnitEnum.M2
  );
  const [dealerQuantity, setDealerQuantity] = useState(
    existingDealerPrice?.quantity ?? 1
  );
  const [retailCurrency, setRetailCurrency] = useState<"USD" | "RUB">(
    (existingRetailPrice?.currency as "USD" | "RUB") ?? "USD"
  );
  const [retailUnit, setRetailUnit] = useState<"M2" | "ITEM">(
    existingRetailPrice?.unit ?? PriceUnitEnum.M2
  );
  const [retailQuantity, setRetailQuantity] = useState(
    existingRetailPrice?.quantity ?? 1
  );

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

      <div className="form-item">
        <label>Цены</label>
        <div className="flex flex-col md:flex-row gap-3 md:gap-8">
          <div>
            <label className="text-sm text-slate-500">Дилерская цена</label>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 !w-28"
                name="dealerPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={existingDealerPrice ? (existingDealerPrice.priceInCents / 100).toFixed(2) : ""}
              />
              <select
                className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 w-20"
                name="dealerCurrency"
                value={dealerCurrency}
                onChange={(e) => setDealerCurrency(e.target.value as "USD" | "RUB")}
              >
                <option value="USD">USD</option>
                <option value="RUB">RUB</option>
              </select>
              <select
                className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 w-24"
                name="dealerUnit"
                value={dealerUnit}
                onChange={(e) => setDealerUnit(e.target.value as "M2" | "ITEM")}
              >
                <option value="M2">за м²</option>
                <option value="ITEM">за шт</option>
              </select>
              {dealerUnit === "ITEM" && (
                <input
                  className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 !w-16"
                  name="dealerQuantity"
                  type="number"
                  min="1"
                  value={dealerQuantity}
                  onChange={(e) => setDealerQuantity(Number(e.target.value))}
                />
              )}
            </div>
            <FormFieldError errors={formState.errors?.dealerPrice} />
            <FormFieldError errors={formState.errors?.dealerQuantity} />
          </div>
          <div>
            <label className="text-sm text-slate-500">Розничная цена</label>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 !w-28"
                name="retailPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={existingRetailPrice ? (existingRetailPrice.priceInCents / 100).toFixed(2) : ""}
              />
              <select
                className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 w-20"
                name="retailCurrency"
                value={retailCurrency}
                onChange={(e) => setRetailCurrency(e.target.value as "USD" | "RUB")}
              >
                <option value="USD">USD</option>
                <option value="RUB">RUB</option>
              </select>
              <select
                className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 w-24"
                name="retailUnit"
                value={retailUnit}
                onChange={(e) => setRetailUnit(e.target.value as "M2" | "ITEM")}
              >
                <option value="M2">за м²</option>
                <option value="ITEM">за шт</option>
              </select>
              {retailUnit === "ITEM" && (
                <input
                  className="border border-slate-300 focus:border-slate-600 focus:outline-none rounded-md py-1 px-2 !w-16"
                  name="retailQuantity"
                  type="number"
                  min="1"
                  value={retailQuantity}
                  onChange={(e) => setRetailQuantity(Number(e.target.value))}
                />
              )}
            </div>
            <FormFieldError errors={formState.errors?.retailPrice} />
            <FormFieldError errors={formState.errors?.retailQuantity} />
          </div>
        </div>
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
