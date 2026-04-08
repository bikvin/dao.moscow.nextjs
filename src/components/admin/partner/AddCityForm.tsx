"use client";

import { useFormState } from "react-dom";
import { addPartnerCity } from "@/actions/partner/cities";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { City } from "@prisma/client";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

export function AddCityForm({
  partnerId,
  allCities,
  existingIds,
}: {
  partnerId: string;
  allCities: City[];
  existingIds: string[];
}) {
  const boundAction = addPartnerCity.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  const available = allCities.filter((c) => !existingIds.includes(c.id));

  if (available.length === 0) return null;

  return (
    <CollapsibleAddSection label="Добавить город" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <select name="cityId" className="admin-form-input text-sm w-48">
          <option value="">— выберите город —</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
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
