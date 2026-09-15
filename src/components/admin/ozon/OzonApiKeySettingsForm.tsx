"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonKeySettings } from "@/actions/ozon/saveOzonKeySettings";

// Form to record when the Ozon API key was last renewed and how long it is valid.
export function OzonApiKeySettingsForm({
  currentRenewDate,
  currentPeriodDays,
}: {
  currentRenewDate: string | null;
  currentPeriodDays: number;
}) {
  const [state, action] = useFormState(saveOzonKeySettings, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <label className="text-sm text-slate-600">Дата обновления ключа:</label>
      <input
        name="ozonKeyRenewDate"
        type="date"
        defaultValue={currentRenewDate ?? ""}
        className="admin-form-input text-sm w-36"
      />
      <label className="text-sm text-slate-600">Срок действия (дней):</label>
      <input
        name="ozonKeyPeriodDays"
        type="number"
        min={1}
        defaultValue={currentPeriodDays}
        className="admin-form-input text-sm w-20"
      />
      <FormButton color="blue" small>Сохранить</FormButton>
      {state.error && <span className="text-red-600 text-sm">{state.error}</span>}
      {state.success && <span className="text-emerald-600 text-sm">{state.success}</span>}
    </form>
  );
}
