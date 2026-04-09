"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addPartnerContactPerson } from "@/actions/partner/contactPersons";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

export function AddContactPersonForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerContactPerson.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (formState.success) { setName(""); setRole(""); setNotes(""); }
  }, [formState.success]);

  return (
    <CollapsibleAddSection label="Добавить контактное лицо" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input name="name" type="text" placeholder="ФИО" value={name} onChange={(e) => setName(e.target.value)} className="admin-form-input text-sm w-48" />
        <input name="role" type="text" placeholder="Должность" value={role} onChange={(e) => setRole(e.target.value)} className="admin-form-input text-sm w-40" />
        <input name="notes" type="text" placeholder="Заметки" value={notes} onChange={(e) => setNotes(e.target.value)} className="admin-form-input text-sm w-52" />
        <FormButton color="green" small>Добавить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
      </form>
    </CollapsibleAddSection>
  );
}
