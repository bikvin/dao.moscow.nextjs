"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addPartnerAddress, updatePartnerAddress } from "@/actions/partner/addresses";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { AddressTypeEnum, PartnerAddress } from "@prisma/client";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

const TYPE_LABELS: Record<AddressTypeEnum, string> = {
  SHOP: "Магазин",
  OFFICE: "Офис",
};

function AddressFields({
  type,
  address,
  onTypeChange,
  onAddressChange,
}: {
  type: AddressTypeEnum;
  address: string;
  onTypeChange: (v: AddressTypeEnum) => void;
  onAddressChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select name="type" value={type} onChange={(e) => onTypeChange(e.target.value as AddressTypeEnum)} className="admin-form-input text-sm w-32">
        {Object.values(AddressTypeEnum).map((t) => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
      <input name="address" type="text" placeholder="Адрес" value={address} onChange={(e) => onAddressChange(e.target.value)} className="admin-form-input text-sm w-72" />
    </div>
  );
}

export function AddAddressForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerAddress.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [type, setType] = useState<AddressTypeEnum>(AddressTypeEnum.SHOP);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (formState.success) { setType(AddressTypeEnum.SHOP); setAddress(""); }
  }, [formState.success]);

  return (
    <CollapsibleAddSection label="Добавить адрес" success={!!formState.success}>
      <form action={action} className="flex flex-col gap-2">
        <AddressFields type={type} address={address} onTypeChange={setType} onAddressChange={setAddress} />
        <div className="flex items-center gap-3">
          <FormButton color="green" small>Добавить</FormButton>
          {formState.errors?._form && (
            <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
          )}
        </div>
      </form>
    </CollapsibleAddSection>
  );
}

export function EditAddressForm({
  partnerId,
  address,
}: {
  partnerId: string;
  address: PartnerAddress;
}) {
  const boundAction = updatePartnerAddress.bind(null, partnerId, address.id);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [type, setType] = useState<AddressTypeEnum>(address.type);
  const [addressValue, setAddressValue] = useState(address.address);

  return (
    <form action={action} className="flex flex-col gap-2 mt-2">
      <AddressFields type={type} address={addressValue} onTypeChange={setType} onAddressChange={setAddressValue} />
      <div className="flex items-center gap-3">
        <FormButton color="blue" small>Сохранить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
        {formState.success && (
          <span className="text-emerald-600 text-sm">{formState.success.message}</span>
        )}
      </div>
    </form>
  );
}
