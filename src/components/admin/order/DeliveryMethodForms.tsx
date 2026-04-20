"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { createDeliveryMethod, updateDeliveryMethod } from "@/actions/order/deliveryMethods";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { DeliveryMethod } from "@prisma/client";
import FormButton from "@/components/common/formButton/formButton";

function DeliveryMethodFields({
  name,
  setName,
  defaultPriceRub,
  setDefaultPriceRub,
}: {
  name: string;
  setName: (v: string) => void;
  defaultPriceRub: string;
  setDefaultPriceRub: (v: string) => void;
}) {
  return (
    <>
      <input
        name="name"
        type="text"
        placeholder="Название"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="admin-form-input text-sm w-56"
      />
      <input
        name="defaultPriceRub"
        type="number"
        placeholder="Цена по умолчанию (₽)"
        value={defaultPriceRub}
        onChange={(e) => setDefaultPriceRub(e.target.value)}
        className="admin-form-input text-sm w-44"
        min="0"
      />
    </>
  );
}

export function CreateDeliveryMethodForm() {
  const [formState, action] = useFormState<SubItemFormState, FormData>(createDeliveryMethod, {});
  const [name, setName] = useState("");
  const [defaultPriceRub, setDefaultPriceRub] = useState("");

  useEffect(() => {
    if (formState.success) {
      setName("");
      setDefaultPriceRub("");
    }
  }, [formState.success]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <DeliveryMethodFields
        name={name}
        setName={setName}
        defaultPriceRub={defaultPriceRub}
        setDefaultPriceRub={setDefaultPriceRub}
      />
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

export function EditDeliveryMethodForm({ method }: { method: DeliveryMethod }) {
  const boundAction = updateDeliveryMethod.bind(null, method.id);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [name, setName] = useState(method.name);
  const [defaultPriceRub, setDefaultPriceRub] = useState(
    method.defaultPriceRub !== null ? String(method.defaultPriceRub / 100) : ""
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <DeliveryMethodFields
        name={name}
        setName={setName}
        defaultPriceRub={defaultPriceRub}
        setDefaultPriceRub={setDefaultPriceRub}
      />
      <FormButton color="blue" small>Сохранить</FormButton>
      {formState.errors?._form && (
        <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
      )}
      {formState.success && (
        <span className="text-emerald-600 text-sm">{formState.success.message}</span>
      )}
    </form>
  );
}
