export interface ProductIssueFormState {
  errors: {
    id?: string[];
    productVariantId?: string[];
    quantity?: string[];
    issueDate?: string[];
    type?: string[];
    description?: string[];
    costPrice?: string[];
    _form?: string[];
  };
}
