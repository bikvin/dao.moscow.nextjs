"use client";

import { useFormState } from "react-dom";
import { createCity } from "@/actions/partner/cities";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import FormButton from "@/components/common/formButton/formButton";

export function CreateCityForm() {
  const [formState, action] = useFormState<SubItemFormState, FormData>(createCity, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="name" type="text" placeholder="Название города" className="admin-form-input text-sm w-56" />
      <FormButton color="green" small>Добавить</FormButton>
      {formState.errors?._form && (
        <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
      )}
      {formState.success && (
        <span className="text-emerald-600 text-sm">{formState.success.message}</span>
      )}
    </form>
  );
}
