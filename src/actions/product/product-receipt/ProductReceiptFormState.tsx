export interface ProductReceiptFormState {
  errors: {
    id?: string[];
    productId?: string[];
    quantity?: string[];
    receiptDate?: string[];
    type?: string[];
    description?: string[];
    _form?: string[];
  };
}
