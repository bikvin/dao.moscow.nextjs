"use client";

import { useFormState } from "react-dom";
import { addPartnerWebsite } from "@/actions/partner/websites";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import FormButton from "@/components/common/formButton/formButton";

export function AddWebsiteForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerWebsite.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 mt-3">
      <input name="url" type="text" placeholder="https://example.com" className="admin-form-input text-sm w-72" />
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
