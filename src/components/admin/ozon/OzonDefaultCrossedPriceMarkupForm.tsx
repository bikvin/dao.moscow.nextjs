"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonDefaultCrossedPriceMarkup } from "@/actions/ozon/saveDefaultCrossedPriceMarkup";

export function OzonDefaultCrossedPriceMarkupForm({ current }: { current: number }) {
  const [formState, action] = useFormState(saveOzonDefaultCrossedPriceMarkup, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Наценка для зачёркнутой цены (%):</label>
      <input
        name="crossedPriceMarkup"
        type="number"
        min={0}
        defaultValue={current}
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
