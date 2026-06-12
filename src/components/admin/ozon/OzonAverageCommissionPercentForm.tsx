"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonAverageCommissionPercent } from "@/actions/ozon/saveOzonAverageCommissionPercent";

// Lets the user set the estimated average Ozon commission rate (% of buyer price).
// Used to estimate payout for orders whose financial_data is not yet populated (delivering).
export function OzonAverageCommissionPercentForm({ current }: { current: number | null }) {
  const [formState, action] = useFormState(saveOzonAverageCommissionPercent, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Средняя комиссия Ozon (% от цены покупателя):</label>
      <input
        name="averageCommissionPercent"
        type="number"
        defaultValue={current ?? ""}
        min={0}
        max={100}
        step={0.1}
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
