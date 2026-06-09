"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { savePickupDeliveryMethod } from "@/actions/order/savePickupDeliveryMethod";

type DeliveryMethodOption = { id: string; name: string };

// Lets the user select which delivery method represents self-pickup orders.
// When an order uses this method, the shipment badge shows "Самовывоз" instead of "Доставка".
export function PickupDeliveryMethodForm({
  deliveryMethods,
  currentDeliveryMethodId,
}: {
  deliveryMethods: DeliveryMethodOption[];
  currentDeliveryMethodId: string | null;
}) {
  const [formState, action] = useFormState(savePickupDeliveryMethod, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Самовывоз:</label>
      {deliveryMethods.length === 0 ? (
        <span className="text-sm text-red-600">Создайте способ доставки</span>
      ) : (
        <select
          name="deliveryMethodId"
          defaultValue={currentDeliveryMethodId ?? ""}
          className="admin-form-input text-sm"
        >
          {!currentDeliveryMethodId && <option value="">Выберите способ доставки...</option>}
          {deliveryMethods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      )}
      <FormButton color="blue" small>
        Сохранить
      </FormButton>
      {formState.errors?._form && (
        <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
      )}
      {formState.success && (
        <span className="text-emerald-600 text-sm">{formState.success.message}</span>
      )}
    </form>
  );
}
