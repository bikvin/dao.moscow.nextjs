"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonDefaultPriceMarkup } from "@/actions/ozon/saveDefaultPriceMarkup";

export function OzonDefaultPriceMarkupForm({ current }: { current: number }) {
  const [formState, action] = useFormState(saveOzonDefaultPriceMarkup, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Наценка к розничной цене (%):</label>
      <input
        name="priceMarkup"
        type="number"
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
