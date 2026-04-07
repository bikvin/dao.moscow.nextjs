"use client";

import { useFormState } from "react-dom";
import { addSampleTypeToAddress } from "@/actions/partner/sampleTypes";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { SampleType } from "@prisma/client";
import FormButton from "@/components/common/formButton/formButton";

export function AddSampleTypeToAddressForm({
  partnerId,
  addressId,
  allSampleTypes,
  existingIds,
}: {
  partnerId: string;
  addressId: string;
  allSampleTypes: SampleType[];
  existingIds: string[];
}) {
  const boundAction = addSampleTypeToAddress.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  const available = allSampleTypes.filter((st) => !existingIds.includes(st.id));

  if (available.length === 0) return null;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 mt-2">
      <input type="hidden" name="addressId" value={addressId} />
      <select name="sampleTypeId" className="admin-form-input text-sm w-48">
        <option value="">— выберите образец —</option>
        {available.map((st) => (
          <option key={st.id} value={st.id}>{st.name}</option>
        ))}
      </select>
      <FormButton color="green" small>Добавить</FormButton>
      {formState.errors?._form && (
        <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
      )}
    </form>
  );
}
