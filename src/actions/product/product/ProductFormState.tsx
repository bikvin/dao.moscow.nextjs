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
    _form?: string[];
  };
}
