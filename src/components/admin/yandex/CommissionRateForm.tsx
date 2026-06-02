"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveCommissionRate } from "@/actions/yandex/saveCommissionRate";

export function CommissionRateForm({ current }: { current: number | null }) {
  const [formState, action] = useFormState(saveCommissionRate, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Комиссия Яндекс (%):</label>
      <input
        name="commissionRate"
        type="number"
        defaultValue={current ?? ""}
        min={0}
        max={100}
        className="admin-form-input w-20 text-sm"
      />
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
