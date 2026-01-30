export interface ProductReceiptFormState {
  errors: {
    id?: string[];
    productVariantId?: string[];
    quantity?: string[];
    receiptDate?: string[];
    type?: string[];
    description?: string[];
    _form?: string[];
  };
}
