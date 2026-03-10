"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonDefaultDivisor } from "@/actions/ozon/saveDefaultDivisor";

export function OzonDefaultDivisorForm({ current }: { current: number | null }) {
  const [formState, action] = useFormState(saveOzonDefaultDivisor, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Глобальный делитель:</label>
      <input
        name="divisor"
        type="number"
        min={1}
        defaultValue={current ?? ""}
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
