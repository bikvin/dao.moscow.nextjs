export interface ProductReceiptFormState {
  errors: {
    id?: string[];
    productVariantId?: string[];
    quantity?: string[];
    receiptDate?: string[];
    type?: string[];
    description?: string[];
    price?: string[];
    priceCurrency?: string[];
    priceUnit?: string[];
    _form?: string[];
  };
}
