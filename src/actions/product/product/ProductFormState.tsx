export interface ProductFormState {
  errors: {
    id?: string[];
    sku?: string[];
    descriptionShort?: string[];
    descriptionLong?: string[];
    imageGroupName?: string[];
    imagesArrString?: string[];
    status?: string[];
    productGroupId?: string[];
    displayOrder?: string[];
    length_mm?: string[];
    width_mm?: string[];
    thickness_mm?: string[];
    chipSizeId?: string[];
    dealerPrice?: string[];
    dealerCurrency?: string[];
    dealerUnit?: string[];
    dealerQuantity?: string[];
    retailPrice?: string[];
    retailCurrency?: string[];
    retailUnit?: string[];
    retailQuantity?: string[];
    _form?: string[];
  };
}
