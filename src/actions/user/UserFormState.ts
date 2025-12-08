export interface UserFormState {
  errors: {
    id?: string[];
    name?: string[];
    email?: string[];
    password?: string[];
    repeatPassword?: string[];
    _form?: string[];
  };
}
