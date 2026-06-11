"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { recalculateOzonOrders } from "@/actions/ozon/recalculateOzonOrders";

// Button that triggers recalculation of Ozon order net prices for all unsettled orders.
export function RecalculateOzonCommissionsButton() {
  const [formState, action] = useFormState(recalculateOzonOrders, {});

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
