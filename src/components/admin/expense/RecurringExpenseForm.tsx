"use client";

import { useFormState } from "react-dom";
import { createRecurringExpense } from "@/actions/expense/createRecurringExpense";
import { updateRecurringExpense } from "@/actions/expense/updateRecurringExpense";
import FormButton from "@/components/common/formButton/formButton";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { deleteRecurringExpenseAction } from "@/actions/expense/deleteRecurringExpenseAction";
import { CurrencyEnum } from "@prisma/client";
import type { RecurringExpense } from "@prisma/client";
import { RecurringExpenseFormState } from "@/zod/expense";
import { useEffect, useRef } from "react";

// Card for an existing recurring expense with inline edit and delete.
export function RecurringExpenseRow({ expense }: { expense: RecurringExpense }) {
  const boundUpdate = updateRecurringExpense.bind(null, expense.id);
  const [state, action] = useFormState<RecurringExpenseFormState, FormData>(boundUpdate, {});

  return (
    <form
      action={action}
      className={`relative border rounded-md shadow-main overflow-hidden mb-3 ${!expense.isActive ? "opacity-50" : ""}`}
    >
      <div className="absolute top-2 right-2">
        <DeleteDialog
          id={expense.id}
          message={`Удалить шаблон «${expense.name}»?`}
          action={deleteRecurringExpenseAction}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3 px-4 py-3 pr-10">
        <div className="flex-1 min-w-40">
          <label className="text-xs text-slate-400 mb-1 block">Название</label>
          <input name="name" defaultValue={expense.name} className="admin-form-input w-full" />
          <FormFieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="w-32">
          <label className="text-xs text-slate-400 mb-1 block">Сумма</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            defaultValue={(expense.amount / 100).toFixed(2)}
            className="admin-form-input w-full"
          />
          <FormFieldError errors={state.fieldErrors?.amount} />
        </div>
        <div className="w-24">
          <label className="text-xs text-slate-400 mb-1 block">Валюта</label>
          <select name="currency" defaultValue={expense.currency} className="admin-form-input w-full">
            {Object.values(CurrencyEnum).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer pb-1.5">
          <input type="hidden" name="isActive" value={expense.isActive ? "true" : "false"} />
          <input
            type="checkbox"
            defaultChecked={expense.isActive}
            onChange={(e) => {
              const hidden = e.currentTarget.closest("form")?.querySelector<HTMLInputElement>('input[name="isActive"]');
              if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
            }}
          />
          Активен
        </label>
        <div className="pb-0.5">
          <FormButton small>Сохранить</FormButton>
        </div>
      </div>
    </form>
  );
}

// Form for creating a new recurring expense template. Resets fields after successful submission.
export function CreateRecurringExpenseForm() {
  const [state, action] = useFormState(createRecurringExpense, {});
  const formRef = useRef<HTMLFormElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!state.fieldErrors && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="border rounded-md shadow-main overflow-hidden">
      <div className="px-4 pt-3 pb-1 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700">Новый шаблон</span>
      </div>
      <div className="flex flex-wrap items-start gap-3 px-4 py-3">
        <div className="flex-1 min-w-40">
          <label className="text-xs text-slate-400 mb-1 block">Название</label>
          <input name="name" placeholder="Название шаблона" className="admin-form-input w-full" />
          <FormFieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="w-32">
          <label className="text-xs text-slate-400 mb-1 block">Сумма</label>
          <input name="amount" type="number" step="0.01" placeholder="0.00" className="admin-form-input w-full" />
          <FormFieldError errors={state.fieldErrors?.amount} />
        </div>
        <div className="w-24">
          <label className="text-xs text-slate-400 mb-1 block">Валюта</label>
          <select name="currency" className="admin-form-input w-full">
            {Object.values(CurrencyEnum).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FormFieldError errors={state.fieldErrors?.currency} />
        </div>
      </div>
      <div className="flex justify-end px-4 py-2 border-t border-slate-100 bg-slate-50">
        <FormButton small>Добавить шаблон</FormButton>
      </div>
    </form>
  );
}
