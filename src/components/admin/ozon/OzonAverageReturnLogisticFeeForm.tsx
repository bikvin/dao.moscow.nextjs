"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonAverageReturnLogisticFee } from "@/actions/ozon/saveOzonAverageReturnLogisticFee";

// Lets the user set the estimated average Ozon reverse logistics fee per returned unit (₽/шт).
// Used to estimate the extra return cost on import before actual transaction fees settle.
export function OzonAverageReturnLogisticFeeForm({ current }: { current: number | null }) {
  const [formState, action] = useFormState(saveOzonAverageReturnLogisticFee, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Средние сборы за обратную логистику (₽/шт):</label>
      <input
        name="averageReturnLogisticFee"
        type="number"
        defaultValue={current ?? ""}
        min={0}
        step={0.01}
        className="admin-form-input w-24 text-sm"
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
