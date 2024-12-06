"use client";
import { useFormState } from "react-dom";

import { login } from "@/actions/auth";
import FormButton from "@/components/common/formButton";

export default function Login() {
  const [errorMessage, action] = useFormState(login, undefined);

  return (
    <form className={"admin-form"} action={action}>
      <div>
        <label htmlFor="name">Почта</label>

        <input className="admin-form-input" name="email" type="email"></input>
      </div>

      <div>
        <label htmlFor="password">Пароль</label>

        <input name="password" type="password"></input>
      </div>
      {errorMessage && <div className="error">{errorMessage}</div>}
      <FormButton>Войти</FormButton>
    </form>
  );
}
