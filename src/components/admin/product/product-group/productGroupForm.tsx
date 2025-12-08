"use client";
import { useFormState } from "react-dom";

// import { createUser } from "@/actions/user/create";
// import { updateUser } from "@/actions/user/update";
import FormButton from "@/components/common/formButton/formButton";
import { updateProductGroup } from "@/actions/product/product-group/update";
import { createProductGroup } from "@/actions/product/product-group/create";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";

export default function ProductGroupForm({
  id,
  name,
  displayOrder,
  isEdit = false,
}: {
  id?: string;
  name?: string;
  displayOrder?: number | null;
  isEdit?: boolean;
}) {
  const usedAction = isEdit ? updateProductGroup : createProductGroup;

  const [formState, action] = useFormState(usedAction, {
    errors: {},
  });

  return (
    <form className={"admin-form"} action={action}>
      <div className="form-item">
        <label htmlFor="name">Название</label>

        <input
          className="admin-form-input"
          name="name"
          type="text"
          defaultValue={isEdit ? name : ""}
        ></input>

        <FormFieldError errors={formState.errors?.name} />
      </div>
      <div className="form-item">
        <label htmlFor="displayOrder">Порядок показа</label>
        <div className="w-16">
          <input
            className="border border-slate-600 rounded block"
            name="displayOrder"
            type="number"
            defaultValue={isEdit ? displayOrder || "" : ""}
          ></input>
        </div>

        <FormFieldError errors={formState.errors?.displayOrder} />
      </div>

      <FormButton>
        {!isEdit ? "Создать группу" : "Редактировать группу"}
      </FormButton>

      <FormFieldError errors={formState.errors?.id} />

      <FormFieldError errors={formState.errors?._form} />
      {isEdit && <input type="hidden" name="id" value={id} />}
    </form>
  );
}
