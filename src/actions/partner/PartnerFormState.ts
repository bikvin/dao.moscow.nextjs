export interface PartnerFormState {
  errors?: {
    name?: string[];
    status?: string[];
    prospectNotes?: string[];
    samplesTypes?: string[];
    _form?: string[];
  };
  success?: { message: string };
}

export interface SubItemFormState {
  errors?: { _form?: string[] };
  success?: { message: string };
}
