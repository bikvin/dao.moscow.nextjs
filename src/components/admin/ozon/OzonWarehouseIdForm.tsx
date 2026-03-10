"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonWarehouseId } from "@/actions/ozon/saveWarehouseId";

export function OzonWarehouseIdForm({ current }: { current: string | null }) {
  const [formState, action] = useFormState(saveOzonWarehouseId, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">ID склада FBS:</label>
      <input
        name="warehouseId"
        type="text"
        defaultValue={current ?? ""}
        placeholder="—"
        className="admin-form-input w-36 text-sm"
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
