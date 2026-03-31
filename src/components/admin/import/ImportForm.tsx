"use client";

import { useFormState } from "react-dom";
import { importPrices, ImportResult } from "@/actions/import/importPrices";
import FormButton from "@/components/common/formButton/formButton";

const initial: ImportResult = { errors: {} };

export function ImportForm() {
  const [state, action] = useFormState(importPrices, initial);

  return (
    <form action={action} className="admin-form">
      <div className="form-item">
        <label htmlFor="file">Excel файл (.xlsx)</label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx"
          className="block text-sm text-slate-600 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>

      <FormButton>Загрузить и импортировать</FormButton>

      {state.errors._form && (
        <p className="mt-4 text-red-700">{state.errors._form[0]}</p>
      )}

      {state.result && (
        <div className="mt-6 p-4 rounded-md bg-slate-50 border border-slate-200">
          <p className="text-emerald-700 font-medium">
            Обновлено товаров: {state.result.updated}
          </p>
          {state.result.skipped.length > 0 && (
            <div className="mt-2">
              <p className="text-amber-600 text-sm">
                Не найдены SKU ({state.result.skipped.length}):
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {state.result.skipped.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
