"use client";

import { useFormState } from "react-dom";
import { addPartnerLegalEntity } from "@/actions/partner/legalEntities";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import FormButton from "@/components/common/formButton/formButton";

export function AddLegalEntityForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerLegalEntity.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 mt-3">
      <input name="name" type="text" placeholder="Название юр. лица" className="admin-form-input text-sm w-60" />
      <input name="inn" type="text" placeholder="ИНН" className="admin-form-input text-sm w-32" />
      <input name="kpp" type="text" placeholder="КПП" className="admin-form-input text-sm w-32" />
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
