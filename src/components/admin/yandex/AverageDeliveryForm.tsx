"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveAverageDelivery } from "@/actions/yandex/saveAverageDelivery";

export function AverageDeliveryForm({ current }: { current: number | null }) {
  const [formState, action] = useFormState(saveAverageDelivery, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Средняя стоимость доставки за единицу (₽/шт):</label>
      <input
        name="averageDelivery"
        type="number"
        defaultValue={current ?? ""}
        min={0}
        className="admin-form-input w-24 text-sm"
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
