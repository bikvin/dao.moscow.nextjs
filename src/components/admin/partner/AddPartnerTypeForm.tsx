"use client";

import { useFormState } from "react-dom";
import { addPartnerType } from "@/actions/partner/partnerTypes";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { PartnerType } from "@prisma/client";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

export function AddPartnerTypeForm({
  partnerId,
  allPartnerTypes,
  existingIds,
}: {
  partnerId: string;
  allPartnerTypes: PartnerType[];
  existingIds: string[];
}) {
  const boundAction = addPartnerType.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  const available = allPartnerTypes.filter((pt) => !existingIds.includes(pt.id));

  if (available.length === 0) return null;

  return (
    <CollapsibleAddSection label="Добавить тип" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <select name="partnerTypeId" className="admin-form-input text-sm w-48">
          <option value="">— выберите тип —</option>
          {available.map((pt) => (
            <option key={pt.id} value={pt.id}>{pt.name}</option>
          ))}
        </select>
        <FormButton color="green" small>Добавить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
      </form>
    </CollapsibleAddSection>
  );
}
