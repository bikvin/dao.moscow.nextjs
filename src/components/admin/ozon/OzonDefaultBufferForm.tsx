"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonDefaultBuffer } from "@/actions/ozon/saveDefaultBuffer";

export function OzonDefaultBufferForm({ current }: { current: number }) {
  const [formState, action] = useFormState(saveOzonDefaultBuffer, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Глобальный буфер (шт.):</label>
      <input
        name="buffer"
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
