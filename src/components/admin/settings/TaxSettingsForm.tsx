"use client";

import { useFormState } from "react-dom";
import { saveTaxSettings } from "@/actions/settings/saveTaxSettings";
import FormButton from "@/components/common/formButton/formButton";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";

// Form for setting the tax rate applied to taxable orders when computing gross margin.
export function TaxSettingsForm({ currentRate }: { currentRate: number | null }) {
  const [formState, action] = useFormState(saveTaxSettings, { errors: {} });

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="form-item">
        <label htmlFor="taxRate">Ставка налога, %</label>
        <div className="flex items-center gap-2">
          <input
            id="taxRate"
            name="taxRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={currentRate ?? ""}
            placeholder="например, 6"
            className="admin-form-input w-28"
          />
          <span className="text-sm text-slate-500">%</span>
        </div>
        <FormFieldError errors={formState.errors?.taxRate} />
      </div>

      <FormButton>Сохранить</FormButton>

      {formState.success && (
        <p className="text-sm text-emerald-700 font-medium">{formState.success.message}</p>
      )}
      <FormFieldError errors={formState.errors?._form} />
    </form>
  );
}
