"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addPartnerEmail } from "@/actions/partner/emails";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

export function AddEmailForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerEmail.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (formState.success) { setEmail(""); setNotes(""); }
  }, [formState.success]);

  return (
    <CollapsibleAddSection label="Добавить email" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input name="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="admin-form-input text-sm w-52" />
        <input name="notes" type="text" placeholder="Примечание (чей email)" value={notes} onChange={(e) => setNotes(e.target.value)} className="admin-form-input text-sm w-52" />
        <FormButton color="green" small>Добавить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
      </form>
    </CollapsibleAddSection>
  );
}
