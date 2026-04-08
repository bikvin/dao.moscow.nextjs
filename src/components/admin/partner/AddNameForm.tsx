"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addPartnerName } from "@/actions/partner/names";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

export function AddNameForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerName.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [name, setName] = useState("");

  useEffect(() => {
    if (formState.success) setName("");
  }, [formState.success]);

  return (
    <CollapsibleAddSection label="Добавить название" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          type="text"
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="admin-form-input text-sm w-60"
        />
        <FormButton color="green" small>Добавить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
      </form>
    </CollapsibleAddSection>
  );
}
