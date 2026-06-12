"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { debugReturnAction } from "@/actions/yandex/debugReturnAction";

// Debug form: accepts a Yandex order ID and triggers a server-side fetch of all
// related raw data (order, financial stats, returns), logging it to the server console.
export function YandexDebugReturnForm() {
  const [formState, action] = useFormState(debugReturnAction, {});

  return (
    <form action={action} className="flex items-center gap-3 flex-wrap">
      <input
        name="orderId"
        type="text"
        placeholder="ID возврата Яндекс"
        className="admin-form-input text-sm w-48"
      />
      <FormButton color="green" small>Показать в консоли</FormButton>
      {formState.errors?._form && (
        <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
      )}
      {formState.success && (
        <span className="text-emerald-600 text-sm">{formState.success.message}</span>
      )}
    </form>
  );
}
