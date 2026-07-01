"use client";

import { useFormState } from "react-dom";
import { createExpense } from "@/actions/expense/createExpense";
import { updateExpense } from "@/actions/expense/updateExpense";
import { deleteExpenseAction } from "@/actions/expense/deleteExpenseAction";
import { createMultipleExpenses } from "@/actions/expense/createMultipleExpenses";
import FormButton from "@/components/common/formButton/formButton";
import { FormFieldError } from "@/components/common/formFieldError/FormFieldError";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { CurrencyEnum } from "@prisma/client";
import type { Expense, RecurringExpense } from "@prisma/client";
import { ExpenseFormState } from "@/zod/expense";
import { useState, useEffect, useRef, useTransition } from "react";

// Form for adding a new single expense entry. Resets fields after successful submission.
export function CreateExpenseForm({ defaultDate }: { defaultDate: string }) {
  const [state, action] = useFormState(createExpense, {});
  const formRef = useRef<HTMLFormElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!state.fieldErrors && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="border rounded-md shadow-main overflow-hidden">
      <div className="px-4 pt-3 pb-1 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700">Новый расход</span>
      </div>
      <div className="flex flex-wrap items-start gap-3 px-4 py-3">
        <div className="flex-1 min-w-40">
          <label className="text-xs text-slate-400 mb-1 block">Название</label>
          <input name="name" placeholder="Название расхода" className="admin-form-input w-full" />
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
        <div className="w-36">
          <label className="text-xs text-slate-400 mb-1 block">Дата</label>
          <input name="date" type="date" defaultValue={defaultDate} className="admin-form-input w-full" />
          <FormFieldError errors={state.fieldErrors?.date} />
        </div>
      </div>
      <div className="flex justify-end px-4 py-2 border-t border-slate-100 bg-slate-50">
        <FormButton small>Добавить</FormButton>
      </div>
    </form>
  );
}


type RowState = { amount: string; currency: CurrencyEnum; date: string };

// Card showing all active recurring templates with checkboxes and a single submit button.
export function GenerateFromRecurring({
  recurring,
  defaultDate,
}: {
  recurring: RecurringExpense[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const active = recurring.filter((r) => r.isActive);

  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(active.map((r) => [r.id, true]))
  );
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(active.map((r) => [r.id, {
      amount: (r.amount / 100).toFixed(2),
      currency: r.currency,
      date: defaultDate,
    }]))
  );

  if (active.length === 0) return null;

  const selectedCount = active.filter((r) => checked[r.id]).length;

  function handleBulkDate(date: string) {
    setRows((prev) => Object.fromEntries(
      Object.entries(prev).map(([id, row]) => [id, { ...row, date }])
    ));
  }

  function handleSubmit() {
    const expenses = active
      .filter((r) => checked[r.id])
      .map((r) => ({
        name: r.name,
        amount: parseFloat(rows[r.id].amount),
        currency: rows[r.id].currency,
        date: rows[r.id].date,
      }))
      .filter((e) => !isNaN(e.amount) && e.amount > 0);

    if (expenses.length === 0) return;
    startTransition(async () => {
      await createMultipleExpenses(expenses);
      setOpen(false);
    });
  }

  return (
    <div className="mt-4 border rounded-md shadow-main overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        <span>Добавить из шаблонов</span>
        <span className="text-slate-400 font-normal">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <>
          <div className="flex items-center justify-end gap-3 px-4 py-2 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500 flex-shrink-0">Дата для всех:</span>
            <input
              type="date"
              defaultValue={defaultDate}
              onChange={(e) => handleBulkDate(e.target.value)}
              className="admin-form-input w-32 text-sm"
            />
          </div>
          <div className="divide-y divide-slate-100">
            {active.map((r) => (
              <div key={r.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${!checked[r.id] ? "opacity-40" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked[r.id] ?? true}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [r.id]: e.target.checked }))}
                  className="w-4 h-4 flex-shrink-0"
                />
                <span className="flex-1 min-w-32 text-sm font-medium text-slate-700">{r.name}</span>
                <div className="w-28">
                  <input
                    type="number"
                    step="0.01"
                    value={rows[r.id]?.amount ?? ""}
                    onChange={(e) => setRows((prev) => ({ ...prev, [r.id]: { ...prev[r.id], amount: e.target.value } }))}
                    className="admin-form-input w-full"
                    disabled={!checked[r.id]}
                  />
                </div>
                <div className="w-20">
                  <select
                    value={rows[r.id]?.currency}
                    onChange={(e) => setRows((prev) => ({ ...prev, [r.id]: { ...prev[r.id], currency: e.target.value as CurrencyEnum } }))}
                    className="admin-form-input w-full"
                    disabled={!checked[r.id]}
                  >
                    {Object.values(CurrencyEnum).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <input
                    type="date"
                    value={rows[r.id]?.date ?? defaultDate}
                    onChange={(e) => setRows((prev) => ({ ...prev, [r.id]: { ...prev[r.id], date: e.target.value } }))}
                    className="admin-form-input w-full"
                    disabled={!checked[r.id]}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400">Выбрано: {selectedCount}</span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || selectedCount === 0}
              className="border-0 rounded-md text-white cursor-pointer text-center bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 p-[5px] w-[150px] text-base"
            >
              {isPending ? "Загружаем..." : "Добавить"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Displays a single expense row with inline edit form and delete dialog.
export function ExpenseRow({
  expense,
  usdRate,
  rmbRate,
}: {
  expense: Expense;
  usdRate?: number | null;
  rmbRate?: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateExpense.bind(null, expense.id);
  const [state, action] = useFormState<ExpenseFormState, FormData>(boundUpdate, {});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!state.fieldErrors && !state.error) setEditing(false);
  }, [state]);

  const dateStr = new Date(expense.date).toLocaleDateString("ru-RU");
  const dateInput = new Date(expense.date).toISOString().slice(0, 10);
  const amount = (expense.amount / 100).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let rubEquiv: number | null = null;
  if (expense.currency === CurrencyEnum.USD && usdRate) rubEquiv = (expense.amount / 100) * usdRate;
  if (expense.currency === CurrencyEnum.RMB && rmbRate) rubEquiv = (expense.amount / 100) * rmbRate;

  if (editing) {
    return (
      <form action={action} className="py-2 border-b border-slate-100 last:border-0">
        <div className="flex flex-wrap items-start gap-2">
          <div className="flex-1 min-w-32">
            <input name="name" defaultValue={expense.name} className="admin-form-input w-full text-sm" />
            <FormFieldError errors={state.fieldErrors?.name} />
          </div>
          <div className="w-28">
            <input name="amount" type="number" step="0.01" defaultValue={(expense.amount / 100).toFixed(2)} className="admin-form-input w-full text-sm" />
            <FormFieldError errors={state.fieldErrors?.amount} />
          </div>
          <div className="w-20">
            <select name="currency" defaultValue={expense.currency} className="admin-form-input w-full text-sm">
              {Object.values(CurrencyEnum).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <input name="date" type="date" defaultValue={dateInput} className="admin-form-input w-full text-sm" />
            <FormFieldError errors={state.fieldErrors?.date} />
          </div>
          <div className="flex gap-2 pt-0.5">
            <FormButton small>Сохранить</FormButton>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-400 hover:text-slate-600 px-2">
              Отмена
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-400 w-24 flex-shrink-0">{dateStr}</span>
      <span className="flex-1 text-slate-700">{expense.name}</span>
      <span className="font-medium">
        {amount} {expense.currency}
        {rubEquiv != null && (
          <span className="text-slate-400 font-normal ml-1">
            ({Math.round(rubEquiv).toLocaleString("ru-RU")} ₽)
          </span>
        )}
      </span>
      <button type="button" onClick={() => setEditing(true)} className="text-slate-300 hover:text-slate-600 text-base">
        ✎
      </button>
      <DeleteDialog
        id={expense.id}
        message={`Удалить «${expense.name}»?`}
        action={deleteExpenseAction}
      />
    </div>
  );
}
