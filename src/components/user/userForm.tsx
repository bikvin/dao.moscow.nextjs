"use client";
import { useFormState } from "react-dom";

// import classes from "./userForm.module.css";
import { createUser } from "@/actions/user/create";
import { editUser } from "@/actions/user/edit";
import FormButton from "@/components/common/formButton";

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
  const usedAction = isEdit ? editUser : createUser;

  const [formState, action] = useFormState(usedAction, {
    errors: {},
  });

  return (
    <form className={"admin-form"} action={action}>
      <div>
        <label htmlFor="name">Имя</label>

        <input
          className="admin-form-input"
          name="name"
          type="text"
          defaultValue={isEdit ? userName : ""}
        ></input>
        {formState.errors && (
          <div className="error">{formState.errors?.name?.join(", ")}</div>
        )}
      </div>
      <div>
        <label htmlFor="email">Почта</label>

        <input
          className="border border-slate-600 rounded block"
          name="email"
          type="text"
          defaultValue={isEdit ? email : ""}
        ></input>
        {formState.errors && (
          <div className="error">{formState.errors?.email?.join(", ")}</div>
        )}
      </div>
      <div>
        <label htmlFor="password">Пароль</label>

        <input name="password" type="password"></input>
        {formState.errors && (
          <div className="error">{formState.errors?.password?.join(", ")}</div>
        )}
      </div>
      <div className="mb-10">
        <label htmlFor="repeatPassword">Повторите пароль</label>

        <input name="repeatPassword" type="password"></input>
        {formState.errors && (
          <div className="error">
            {formState.errors?.repeatPassword?.join(", ")}
          </div>
        )}
      </div>
      <FormButton>
        {!isEdit
          ? "Создать первого и единственного пользователя"
          : "Редактировать пользователя"}
      </FormButton>
      {formState.errors && (
        <div className="error">{formState.errors?._form?.join(", ")}</div>
      )}
      {isEdit && <input type="hidden" name="id" value={id} />}
    </form>
  );
}
