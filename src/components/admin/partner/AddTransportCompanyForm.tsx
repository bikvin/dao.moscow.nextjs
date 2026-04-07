"use client";

import { useFormState } from "react-dom";
import { addPartnerTransportCompany } from "@/actions/partner/transportCompanies";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { TransportCompany } from "@prisma/client";
import FormButton from "@/components/common/formButton/formButton";

export function AddTransportCompanyForm({
  partnerId,
  allTransportCompanies,
  existingIds,
}: {
  partnerId: string;
  allTransportCompanies: TransportCompany[];
  existingIds: string[];
}) {
  const boundAction = addPartnerTransportCompany.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  const available = allTransportCompanies.filter((tc) => !existingIds.includes(tc.id));

  if (available.length === 0) return null;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 mt-3">
      <select name="tcId" className="admin-form-input text-sm w-56">
        <option value="">— выберите компанию —</option>
        {available.map((tc) => (
          <option key={tc.id} value={tc.id}>{tc.name}</option>
        ))}
      </select>
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
