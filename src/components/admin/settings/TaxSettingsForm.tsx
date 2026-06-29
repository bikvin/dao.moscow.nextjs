"use client";

import { useFormState } from "react-dom";
import { saveTaxSettings } from "@/actions/settings/saveTaxSettings";
import FormButton from "@/components/common/formButton/formButton";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";

type PaymentMethod = { id: string; name: string };

// Form for setting the tax rate and which payment methods are subject to tax.
export function TaxSettingsForm({
  currentRate,
  paymentMethods,
  taxablePaymentMethodIds,
}: {
  currentRate: number | null;
  paymentMethods: PaymentMethod[];
  taxablePaymentMethodIds: string[];
}) {
  const [formState, action] = useFormState(saveTaxSettings, { errors: {} });

  return (
    <form action={action} className="flex flex-col gap-6">
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

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Облагаемые способы оплаты</label>
        <div className="flex flex-col gap-2">
          {paymentMethods.map((pm) => (
            <label key={pm.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="taxablePaymentMethodIds"
                value={pm.id}
                defaultChecked={taxablePaymentMethodIds.includes(pm.id)}
                className="w-4 h-4"
              />
              {pm.name}
            </label>
          ))}
        </div>
      </div>

      <FormButton>Сохранить</FormButton>

      {formState.success && (
        <p className="text-sm text-emerald-700 font-medium">{formState.success.message}</p>
      )}
      <FormFieldError errors={formState.errors?._form} />
    </form>
  );
}
