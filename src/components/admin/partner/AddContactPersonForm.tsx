"use client";

import { useFormState } from "react-dom";
import { addPartnerContactPerson } from "@/actions/partner/contactPersons";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import FormButton from "@/components/common/formButton/formButton";

export function AddContactPersonForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerContactPerson.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 mt-3">
      <input name="name" type="text" placeholder="ФИО" className="admin-form-input text-sm w-48" />
      <input name="role" type="text" placeholder="Должность" className="admin-form-input text-sm w-40" />
      <input name="notes" type="text" placeholder="Заметки" className="admin-form-input text-sm w-52" />
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
