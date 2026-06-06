"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveYandexPaymentMethod } from "@/actions/yandex/saveYandexPaymentMethod";

type PaymentMethodOption = { id: string; name: string };

// Lets the user select which payment method represents marketplace payments from Yandex.
// The selected method is auto-assigned to imported orders and hides the paid toggle in order cards.
export function YandexPaymentMethodForm({
  paymentMethods,
  currentPaymentMethodId,
}: {
  paymentMethods: PaymentMethodOption[];
  currentPaymentMethodId: string | null;
}) {
  const [formState, action] = useFormState(saveYandexPaymentMethod, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Способ оплаты (маркетплейс):</label>
      {paymentMethods.length === 0 ? (
        <span className="text-sm text-red-600">Создайте способ оплаты в настройках</span>
      ) : (
        <select
          name="paymentMethodId"
          defaultValue={currentPaymentMethodId ?? ""}
          className="admin-form-input text-sm"
        >
          {!currentPaymentMethodId && <option value="">Выберите способ оплаты...</option>}
          {paymentMethods.map((m) => (
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
