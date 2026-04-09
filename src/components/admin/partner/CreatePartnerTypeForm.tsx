"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { createPartnerType } from "@/actions/partner/partnerTypes";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import FormButton from "@/components/common/formButton/formButton";

export function CreatePartnerTypeForm() {
  const [formState, action] = useFormState<SubItemFormState, FormData>(createPartnerType, {});
  const [name, setName] = useState("");

  useEffect(() => {
    if (formState.success) setName("");
  }, [formState.success]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="name" type="text" placeholder="Название типа" value={name} onChange={(e) => setName(e.target.value)} className="admin-form-input text-sm w-56" />
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
