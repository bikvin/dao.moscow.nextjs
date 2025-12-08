"use client";
import { useFormState } from "react-dom";

import { createUser } from "@/actions/user/create";
import { updateUser } from "@/actions/user/update";
import FormButton from "@/components/common/formButton/formButton";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";

export default function UserForm({
  userName,
  email,
  id,
  isEdit = false,
}: {
  userName?: string;
  email?: string;
  id?: string;
  isEdit?: boolean;
}) {
  const usedAction = isEdit ? updateUser : createUser;

  const [formState, action] = useFormState(usedAction, {
    errors: {},
  });

  return (
    <form className={"admin-form"} action={action}>
      <div className="form-item">
        <label htmlFor="name">Имя</label>

        <input
          className="admin-form-input"
          name="name"
          type="text"
          defaultValue={isEdit ? userName : ""}
        ></input>

        <FormFieldError errors={formState.errors?.name} />
      </div>
      <div className="form-item">
        <label htmlFor="email">Почта</label>

        <input
          className="border border-slate-600 rounded block"
          name="email"
          type="text"
          defaultValue={isEdit ? email : ""}
        ></input>

        <FormFieldError errors={formState.errors?.email} />
      </div>
      <div className="form-item">
        <label htmlFor="password">Пароль</label>

        <input name="password" type="password"></input>

        <FormFieldError errors={formState.errors?.password} />
      </div>
      <div className="form-item">
        <label htmlFor="repeatPassword">Повторите пароль</label>

        <input name="repeatPassword" type="password"></input>

        <FormFieldError errors={formState.errors?.repeatPassword} />
      </div>
      <FormButton>
        {!isEdit ? "Создать пользователя" : "Редактировать пользователя"}
      </FormButton>

      <FormFieldError errors={formState.errors?.id} />

      <FormFieldError errors={formState.errors?._form} />
      {isEdit && <input type="hidden" name="id" value={id} />}
    </form>
  );
}
