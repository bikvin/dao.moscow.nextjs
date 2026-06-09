"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { recalculateYandexOrders } from "@/actions/yandex/recalculateYandexOrders";

// Button that triggers recalculation of Yandex order net prices for all unsettled orders.
// Shows success message (with count of updated orders) or error after submission.
export function RecalculateCommissionsButton() {
  const [formState, action] = useFormState(recalculateYandexOrders, {});

  return (
    <form action={action} className="inline-block">
      <FormButton color="green" small>
        Пересчитать комиссии
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
