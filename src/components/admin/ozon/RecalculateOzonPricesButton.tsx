"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { recalculateAllOzonPrices } from "@/actions/ozon/recalculateAllOzonPrices";

export function RecalculateOzonPricesButton() {
  const [formState, action] = useFormState(recalculateAllOzonPrices, { errors: {} });

  return (
    <form action={action} className="inline-block">
      <FormButton color="blue" small>
        Пересчитать цены
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
