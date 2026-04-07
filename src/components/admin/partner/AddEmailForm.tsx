"use client";

import { useFormState } from "react-dom";
import { addPartnerEmail } from "@/actions/partner/emails";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import FormButton from "@/components/common/formButton/formButton";

export function AddEmailForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerEmail.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 mt-3">
      <input name="email" type="email" placeholder="Email" className="admin-form-input text-sm w-52" />
      <input name="notes" type="text" placeholder="Примечание (чей email)" className="admin-form-input text-sm w-52" />
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
