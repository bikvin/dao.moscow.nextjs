"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { fetchOrdersAction } from "@/actions/yandex/fetchOrders";

export function YandexFetchOrdersButton() {
  const [formState, action] = useFormState(fetchOrdersAction, {});

  return (
    <form action={action} className="inline-block">
      <FormButton color="green" small>
        Загрузить заказы (debug)
      </FormButton>
      {formState.errors?._form && (
        <div className="text-red-600 text-sm mt-1">
          {formState.errors._form.join(", ")}
        </div>
      )}
      {formState.success && (
        <div className="text-emerald-600 text-sm mt-1">
          {formState.success.message}
        </div>
      )}
    </form>
  );
}
