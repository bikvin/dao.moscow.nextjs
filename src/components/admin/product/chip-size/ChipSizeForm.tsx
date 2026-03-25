"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import { createChipSize } from "@/actions/product/chip-size/create";
import { updateChipSize } from "@/actions/product/chip-size/update";

export default function ChipSizeForm({
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
  const usedAction = isEdit ? updateChipSize : createChipSize;
  const [formState, action] = useFormState(usedAction, { errors: {} });

  return (
    <form className="admin-form" action={action}>
      <div className="form-item">
        <label htmlFor="name">Название</label>
        <input
          className="admin-form-input"
          name="name"
          type="text"
          defaultValue={isEdit ? name : ""}
        />
        <FormFieldError errors={formState.errors?.name} />
      </div>
      <div className="form-item">
        <label htmlFor="displayOrder">Порядок показа</label>
        <div className="w-16">
          <input
            className="border border-slate-600 rounded block"
            name="displayOrder"
            type="number"
            defaultValue={isEdit ? displayOrder ?? "" : ""}
          />
        </div>
        <FormFieldError errors={formState.errors?.displayOrder} />
      </div>

      <FormButton>{isEdit ? "Сохранить" : "Создать"}</FormButton>

      <FormFieldError errors={formState.errors?._form} />
      {isEdit && <input type="hidden" name="id" value={id} />}
    </form>
  );
}
