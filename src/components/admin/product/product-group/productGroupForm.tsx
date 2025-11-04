"use client";
import { useFormState } from "react-dom";

// import { createUser } from "@/actions/user/create";
// import { updateUser } from "@/actions/user/update";
import FormButton from "@/components/common/formButton/formButton";
import { updateProductGroup } from "@/actions/product/product-group/update";
import { createProductGroup } from "@/actions/product/product-group/create";

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
      <div>
        <label htmlFor="name">Название</label>

        <input
          className="admin-form-input"
          name="name"
          type="text"
          defaultValue={isEdit ? name : ""}
        ></input>
        {formState.errors && (
          <div className="error">{formState.errors?.name?.join(", ")}</div>
        )}
      </div>
      <div>
        <label htmlFor="displayOrder">Порядок показа</label>
        <div className="w-16">
          <input
            className="border border-slate-600 rounded block"
            name="displayOrder"
            type="number"
            defaultValue={isEdit ? displayOrder || "" : ""}
          ></input>
        </div>

        {formState.errors && (
          <div className="error">
            {formState.errors?.displayOrder?.join(", ")}
          </div>
        )}
      </div>

      <FormButton>
        {!isEdit ? "Создать группу" : "Редактировать группу"}
      </FormButton>
      {formState.errors && (
        <div className="error">{formState.errors?._form?.join(", ")}</div>
      )}
      {isEdit && <input type="hidden" name="id" value={id} />}
    </form>
  );
}
