export interface ProductReserveFormState {
  errors: {
    id?: string[];
    productVariantId?: string[];
    quantity?: string[];
    reserveDate?: string[];
    client?: string[];
    status?: string[];
    _form?: string[];
  };
}
