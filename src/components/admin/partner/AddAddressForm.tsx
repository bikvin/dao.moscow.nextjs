"use client";

import { useFormState } from "react-dom";
import { addPartnerAddress } from "@/actions/partner/addresses";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { AddressTypeEnum } from "@prisma/client";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

const TYPE_LABELS: Record<AddressTypeEnum, string> = {
  SHOP: "Магазин",
  OFFICE: "Офис",
};

export function AddAddressForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerAddress.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});

  return (
    <CollapsibleAddSection label="Добавить адрес" success={!!formState.success}>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <select name="type" className="admin-form-input text-sm w-32">
          {Object.values(AddressTypeEnum).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <input name="address" type="text" placeholder="Адрес" className="admin-form-input text-sm w-72" />
        <FormButton color="green" small>Добавить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
      </form>
    </CollapsibleAddSection>
  );
}
