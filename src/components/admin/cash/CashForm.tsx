"use client";

import React, { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createCashTransaction } from "@/actions/cash/createCashTransaction";
import { deleteCashTransactionAction } from "@/actions/cash/deleteCashTransactionAction";
import { CashFlowType, CurrencyEnum } from "@prisma/client";
import { type CashTransactionFormState } from "@/zod/cash";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { ChevronsUp, ChevronsDown } from "lucide-react";

const CURRENCY_LABELS: Record<CurrencyEnum, string> = {
  RUB: "₽ Рубль",
  USD: "$ Доллар",
  EUR: "€ Евро",
  RMB: "¥ Юань",
};

const CURRENCY_SYMBOLS: Record<CurrencyEnum, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
  RMB: "¥",
};

type Transaction = {
  id: string;
  date: Date;
  type: CashFlowType;
  currency: CurrencyEnum;
  amount: number;
  description: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">
      {pending ? "..." : "Добавить транзакцию"}
    </button>
  );
}

// Form for adding a new cash transaction.
export function CreateCashTransactionForm({ defaultCurrency = CurrencyEnum.RUB }: { defaultCurrency?: CurrencyEnum }) {
  const [state, action] = useFormState<CashTransactionFormState, FormData>(
    createCashTransaction,
    {},
  );

  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef(state);

  // Reset form and scroll to bottom after a successful submission.
  useEffect(() => {
    if (prevStateRef.current !== state && !state.fieldErrors && !state.error) {
      formRef.current?.reset();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
    prevStateRef.current = state;
  }, [state]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form ref={formRef} action={action} className="flex flex-wrap gap-2 items-start">
      <div className="flex flex-col gap-1">
        <input
          name="date"
          type="date"
          defaultValue={today}
          className="admin-form-input text-sm w-36"
        />
        {state.fieldErrors?.date && (
          <span className="text-xs text-red-500">{state.fieldErrors.date[0]}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <select name="type" defaultValue="IN" className="admin-form-input text-sm w-32">
          <option value="IN">Приход</option>
          <option value="OUT">Расход</option>
        </select>
        {state.fieldErrors?.type && (
          <span className="text-xs text-red-500">{state.fieldErrors.type[0]}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <select name="currency" defaultValue={defaultCurrency} className="admin-form-input text-sm w-36">
          {Object.values(CurrencyEnum).map((c) => (
            <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
          ))}
        </select>
        {state.fieldErrors?.currency && (
          <span className="text-xs text-red-500">{state.fieldErrors.currency[0]}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Сумма"
          className="admin-form-input text-sm w-36"
        />
        {state.fieldErrors?.amount && (
          <span className="text-xs text-red-500">{state.fieldErrors.amount[0]}</span>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-48">
        <input
          name="description"
          type="text"
          placeholder="Описание"
          required
          className="admin-form-input text-sm w-full"
        />
      </div>

      <SubmitButton />

      {state.error && (
        <p className="w-full text-sm text-red-500">{state.error}</p>
      )}
    </form>
  );
}

// Displays the balance summary cards for each currency; clicking one filters the transaction list.
export function CashBalances({
  balances,
  selectedCurrency,
  selectedYear,
}: {
  balances: { currency: CurrencyEnum; balance: number }[];
  selectedCurrency: CurrencyEnum;
  selectedYear: number;
}) {
  const router = useRouter();

  function select(currency: CurrencyEnum) {
    const params = new URLSearchParams();
    params.set("currency", currency);
    params.set("year", String(selectedYear));
    router.push(`/admin/cash?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {balances.map(({ currency, balance }) => {
        const isSelected = currency === selectedCurrency;
        const isNegative = balance < 0;
        return (
          <button
            key={currency}
            type="button"
            onClick={() => select(currency)}
            className={`rounded-lg border px-5 py-3 min-w-36 text-left transition-all ${
              isSelected
                ? isNegative
                  ? "border-red-400 bg-red-50 ring-2 ring-red-300"
                  : "border-slate-400 bg-slate-50 ring-2 ring-slate-300"
                : isNegative
                  ? "border-red-200 bg-red-50 hover:border-red-300"
                  : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="text-xs text-slate-400 mb-1">{CURRENCY_LABELS[currency]}</div>
            <div className={`text-xl font-semibold tabular-nums ${isNegative ? "text-red-600" : "text-slate-800"}`}>
              {isNegative ? "−" : ""}
              {CURRENCY_SYMBOLS[currency]}
              {Math.abs(balance / 100).toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Header row for the ledger table.
export function CashTableHeader({ currency }: { currency: CurrencyEnum }) {
  const sym = CURRENCY_SYMBOLS[currency];
  return (
    <div className="grid grid-cols-[96px_180px_120px_120px_32px] gap-x-3 px-3 py-1.5 text-xs font-medium text-slate-400 border-b border-slate-200">
      <div>Дата</div>
      <div>Источник / комментарий</div>
      <div className="text-right text-emerald-600">Приход {sym}</div>
      <div className="text-right text-red-400">Расход {sym}</div>
      <div />
    </div>
  );
}

// Single row in the ledger table.
export function CashTransactionRow({ tx }: { tx: Transaction }) {
  const isIn = tx.type === CashFlowType.IN;
  const formatted = (tx.amount / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="grid grid-cols-[96px_180px_120px_120px_32px] gap-x-3 px-3 py-1.5 text-sm hover:bg-slate-50 items-center">
      <div className="text-xs text-slate-400">
        {new Date(tx.date).toLocaleDateString("ru-RU")}
      </div>
      <div className="text-slate-700 truncate">{tx.description ?? <span className="text-slate-300 italic">—</span>}</div>
      <div className={`text-right tabular-nums font-medium ${isIn ? "text-emerald-600" : "text-slate-200"}`}>
        {isIn ? formatted : ""}
      </div>
      <div className={`text-right tabular-nums font-medium ${!isIn ? "text-red-500" : "text-slate-200"}`}>
        {!isIn ? formatted : ""}
      </div>
      <DeleteItemButton
        action={deleteCashTransactionAction}
        fields={{ id: tx.id }}
        message="Удалить операцию?"
      />
    </div>
  );
}

// Fixed scroll-to-top and scroll-to-bottom buttons.
export function ScrollButtons() {
  return (
    <div className="fixed bottom-6 right-4 flex flex-col gap-2 z-50">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Наверх"
        className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-colors"
      >
        <ChevronsUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
        title="Вниз"
        className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-colors"
      >
        <ChevronsDown className="w-4 h-4" />
      </button>
    </div>
  );
}
