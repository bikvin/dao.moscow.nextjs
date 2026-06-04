// Shared form state type used by all Yandex settings actions.
export interface BufferFormState {
  errors?: { _form?: string[] };
  success?: { message: string };
}
