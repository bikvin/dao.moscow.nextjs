"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addPartnerWebsite } from "@/actions/partner/websites";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

export function AddWebsiteForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerWebsite.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (formState.success) setUrl("");
  }, [formState.success]);

  return (
    <CollapsibleAddSection label="Добавить сайт" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input name="url" type="text" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="admin-form-input text-sm w-72" />
        <FormButton color="green" small>Добавить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
      </form>
    </CollapsibleAddSection>
  );
}
