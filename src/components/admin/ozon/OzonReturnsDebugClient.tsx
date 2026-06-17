"use client";

import { useState, useTransition } from "react";
import { fetchOzonReturnCandidates } from "@/actions/ozon/fetchOzonReturnCandidates";
import type { OzonReturnCandidate } from "@/actions/ozon/fetchOzonReturnCandidates";

function fmt(n: number): string {
  return Math.abs(n).toLocaleString("ru-RU");
}

// OzonReturnsDebugClient renders the date-range picker, fetches return candidates
// grouped by posting_number, and displays them with financial details and raw data toggle.
// No import functionality — used to verify API data before building the import flow.
export function OzonReturnsDebugClient() {
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(sixMonthsAgo);
  const [toDate, setToDate] = useState(today);
  const [candidates, setCandidates] = useState<OzonReturnCandidate[]>([]);
  const [expandedRaw, setExpandedRaw] = useState<Set<string>>(new Set());
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, startFetch] = useTransition();

  function handleFetch() {
    setFetchError(null);
    startFetch(async () => {
      const result = await fetchOzonReturnCandidates(fromDate, toDate);
      if ("error" in result) {
        setFetchError(result.error);
        return;
      }
      setCandidates(result.candidates);
      setExpandedRaw(new Set());
      setHasFetched(true);
    });
  }

  function toggleRaw(postingNumber: string) {
    setExpandedRaw((prev) => {
      const next = new Set(prev);
      if (next.has(postingNumber)) { next.delete(postingNumber); } else { next.add(postingNumber); }
      return next;
    });
  }

  return (
    <div className="mt-8 pb-16">
      {/* Fetch controls */}
      <div className="border rounded-md p-4 shadow-main flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Дата с</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="admin-form-input text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">по</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="admin-form-input text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={isFetching}
          className="border-0 rounded-md text-white cursor-pointer bg-green-500 hover:bg-green-600 disabled:bg-slate-300 p-[5px] w-[180px] text-base"
        >
          {isFetching ? "Загрузка..." : "Загрузить возвраты"}
        </button>
      </div>

      {fetchError && <p className="text-red-600 text-sm mt-3">{fetchError}</p>}

      {hasFetched && (
        <div className="mt-6">
          {candidates.length === 0 ? (
            <p className="text-slate-500 text-sm">Нет возвратов за выбранный период</p>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Найдено постингов с возвратами: <strong>{candidates.length}</strong>
              </p>

              <div className="flex flex-col gap-3">
                {candidates.map((c) => {
                  const showRaw = expandedRaw.has(c.postingNumber);
                  const isCancellation = c.returnType === "Cancellation";

                  return (
                    <div key={c.postingNumber} className="border rounded-md p-4 shadow-main bg-white">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-medium">{c.postingNumber}</span>
                        <span className="text-sm text-slate-500">
                          {c.returnDate ? c.returnDate.slice(0, 10) : "—"}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isCancellation
                              ? "bg-slate-100 text-slate-600"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {c.returnType}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            c.visualStatus === "ReceivedBySeller"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {c.visualStatusDisplay}
                        </span>
                        {c.isOpened && (
                          <span className="text-xs text-amber-600 font-medium">вскрыт</span>
                        )}
                        <span className="ml-auto text-sm text-slate-500">
                          Ozon заказ {c.orderNumber}
                          {c.originalOrder && (
                            <span className="ml-2 text-emerald-700 font-medium">
                              → наш #{c.originalOrder.year}-{c.originalOrder.sequenceNumber}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="mt-1.5 pl-0 text-xs text-slate-400 italic">
                        {c.returnReasonName}
                      </div>

                      {/* Items */}
                      <div className="mt-3 flex flex-col gap-1.5">
                        {c.items.map((item, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-2 text-sm pl-0">
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.offerId}
                            </span>
                            <span className="text-slate-500">
                              {item.quantity} × {fmt(item.priceWithoutCommissionRub)} ₽/шт
                              {item.commissionPercent > 0 && (
                                <span className="text-slate-400 ml-1">
                                  (ком. {item.commissionPercent}%)
                                </span>
                              )}
                              {" = "}
                              <span className="font-medium text-slate-700">
                                {fmt(item.priceWithoutCommissionRub * item.quantity)} ₽
                              </span>
                            </span>
                            {!item.product ? (
                              <span className="text-amber-600 text-xs">⚠ Товар не найден</span>
                            ) : (
                              <span className="text-slate-400 text-xs">
                                {item.product.variants.length === 1
                                  ? item.product.variants[0].variantName
                                  : `${item.product.variants.length} вариантов`}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Financial breakdown */}
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                        <span className="text-slate-500">
                          выплата −{fmt(c.payoutRub)} ₽
                        </span>
                        <span className="text-slate-400">−</span>
                        <span className="text-slate-500">
                          обратная логистика {c.feesSettled ? "" : "≈"}{fmt(c.returnLogisticFeeRub)} ₽
                        </span>
                        <span className="text-slate-400">=</span>
                        <span className={`font-medium ${c.feesSettled ? "text-red-700" : "text-slate-500"}`}>
                          {c.feesSettled ? "" : "≈"}−{fmt(c.sellerImpactRub)} ₽
                          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded font-normal ${c.feesSettled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                            {c.feesSettled ? "факт" : "оценка"}
                          </span>
                        </span>
                      </div>

                      {/* Raw data toggle */}
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => toggleRaw(c.postingNumber)}
                          className="text-xs text-slate-400 hover:text-slate-600 underline"
                        >
                          {showRaw ? "Скрыть сырые данные" : "Показать сырые данные Ozon"}
                        </button>
                        {showRaw && (
                          <div className="mt-2 space-y-2">
                            <div className="bg-slate-50 rounded p-3 text-xs font-mono overflow-x-auto">
                              <p className="text-slate-400 mb-1 font-sans">returns API</p>
                              <pre className="text-slate-600 whitespace-pre-wrap">
                                {JSON.stringify(c.rawReturns, null, 2)}
                              </pre>
                            </div>
                            {c.rawLogisticsTransactions.length > 0 && (
                              <div className="bg-slate-50 rounded p-3 text-xs font-mono overflow-x-auto">
                                <p className="text-slate-400 mb-1 font-sans">
                                  OperationReturnGoodsFBSofRMS ({c.rawLogisticsTransactions.length})
                                </p>
                                <pre className="text-slate-600 whitespace-pre-wrap">
                                  {JSON.stringify(c.rawLogisticsTransactions, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
