export interface ProductIssueFormState {
  errors: {
    id?: string[];
    productVariantId?: string[];
    quantity?: string[];
    issueDate?: string[];
    type?: string[];
    description?: string[];
    _form?: string[];
  };
}
