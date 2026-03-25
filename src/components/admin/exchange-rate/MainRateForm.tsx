"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import FormButton from "@/components/common/formButton/formButton";
import { saveMainRateSettings } from "@/actions/exchange-rate/saveMainRateSettings";

type Mode = "official" | "markup" | "manual";

interface Props {
  currentMode: Mode;
  currentMarkup: number;
  currentManual: number;
}

export function MainRateForm({ currentMode, currentMarkup, currentManual }: Props) {
  const [formState, action] = useFormState(saveMainRateSettings, {});
  const [mode, setMode] = useState<Mode>(currentMode);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="official"
            checked={mode === "official"}
            onChange={() => setMode("official")}
          />
          <span className="text-sm">Равен официальному курсу ЦБ</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="markup"
            checked={mode === "markup"}
            onChange={() => setMode("markup")}
          />
          <span className="text-sm">Официальный курс + наценка (%)</span>
        </label>
        {mode === "markup" && (
          <div className="flex items-center gap-2 ml-6">
            <input
              name="markup"
              type="number"
              min={0}
              step={0.1}
              defaultValue={currentMarkup}
              className="admin-form-input w-24 text-sm"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="manual"
            checked={mode === "manual"}
            onChange={() => setMode("manual")}
          />
          <span className="text-sm">Ручной курс</span>
        </label>
        {mode === "manual" && (
          <div className="flex items-center gap-2 ml-6">
            <input
              name="manual"
              type="number"
              min={0}
              step={0.01}
              defaultValue={currentManual}
              className="admin-form-input w-28 text-sm"
            />
            <span className="text-sm text-slate-500">₽ за 1 USD</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <FormButton color="blue" small>
          Сохранить
        </FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
        {formState.success && (
          <span className="text-emerald-600 text-sm">{formState.success.message}</span>
        )}
      </div>
    </form>
  );
}
