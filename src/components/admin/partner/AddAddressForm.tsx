"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addPartnerAddress, updatePartnerAddress } from "@/actions/partner/addresses";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { AddressTypeEnum, PartnerAddress, ShoppingMall } from "@prisma/client";
import { CollapsibleAddSection } from "./CollapsibleAddSection";
import FormButton from "@/components/common/formButton/formButton";

const TYPE_LABELS: Record<AddressTypeEnum, string> = {
  SHOP: "Магазин",
  OFFICE: "Офис",
};

function AddressFields({
  type,
  address,
  comment,
  shoppingMallId,
  allShoppingMalls,
  onTypeChange,
  onAddressChange,
  onCommentChange,
  onShoppingMallChange,
}: {
  type: AddressTypeEnum;
  address: string;
  comment: string;
  shoppingMallId: string;
  allShoppingMalls: ShoppingMall[];
  onTypeChange: (v: AddressTypeEnum) => void;
  onAddressChange: (v: string) => void;
  onCommentChange: (v: string) => void;
  onShoppingMallChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select name="type" value={type} onChange={(e) => onTypeChange(e.target.value as AddressTypeEnum)} className="admin-form-input text-sm w-32">
        {Object.values(AddressTypeEnum).map((t) => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
      <input name="address" type="text" placeholder="Адрес" value={address} onChange={(e) => onAddressChange(e.target.value)} className="admin-form-input text-sm w-72" />
      <input name="comment" type="text" placeholder="Комментарий" value={comment} onChange={(e) => onCommentChange(e.target.value)} className="admin-form-input text-sm w-56" />
      <select name="shoppingMallId" value={shoppingMallId} onChange={(e) => onShoppingMallChange(e.target.value)} className="admin-form-input text-sm w-48">
        <option value="">— ТЦ не выбран —</option>
        {allShoppingMalls.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  );
}

export function AddAddressForm({
  partnerId,
  allShoppingMalls,
}: {
  partnerId: string;
  allShoppingMalls: ShoppingMall[];
}) {
  const boundAction = addPartnerAddress.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [type, setType] = useState<AddressTypeEnum>(AddressTypeEnum.SHOP);
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [shoppingMallId, setShoppingMallId] = useState("");

  useEffect(() => {
    if (formState.success) { setType(AddressTypeEnum.SHOP); setAddress(""); setComment(""); setShoppingMallId(""); }
  }, [formState.success]);

  return (
    <CollapsibleAddSection label="Добавить адрес" success={!!formState.success}>
      <form action={action} className="flex flex-col gap-2">
        <AddressFields
          type={type} address={address} comment={comment} shoppingMallId={shoppingMallId}
          allShoppingMalls={allShoppingMalls}
          onTypeChange={setType} onAddressChange={setAddress} onCommentChange={setComment} onShoppingMallChange={setShoppingMallId}
        />
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
  allShoppingMalls,
}: {
  partnerId: string;
  address: PartnerAddress;
  allShoppingMalls: ShoppingMall[];
}) {
  const boundAction = updatePartnerAddress.bind(null, partnerId, address.id);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [type, setType] = useState<AddressTypeEnum>(address.type);
  const [addressValue, setAddressValue] = useState(address.address);
  const [comment, setComment] = useState(address.comment ?? "");
  const [shoppingMallId, setShoppingMallId] = useState(address.shoppingMallId ?? "");

  return (
    <form action={action} className="flex flex-col gap-2">
      <AddressFields
        type={type} address={addressValue} comment={comment} shoppingMallId={shoppingMallId}
        allShoppingMalls={allShoppingMalls}
        onTypeChange={setType} onAddressChange={setAddressValue} onCommentChange={setComment} onShoppingMallChange={setShoppingMallId}
      />
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
