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
    _form?: string[];
  };
}
