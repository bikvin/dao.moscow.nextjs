"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchOzonReturnCandidates } from "@/actions/ozon/fetchOzonReturnCandidates";
import type { OzonReturnCandidate } from "@/actions/ozon/fetchOzonReturnCandidates";
import { importOzonReturns } from "@/actions/ozon/importOzonReturns";
import type { ImportOzonReturn } from "@/actions/ozon/importOzonReturns";

function fmt(n: number): string {
  return Math.round(Math.abs(n)).toLocaleString("ru-RU");
}

// Returns true if all items in the candidate have a mapped product with at least one variant.
function isReady(c: OzonReturnCandidate): boolean {
  return c.items.every((i) => i.product && i.product.variants.length > 0);
}

// Converts a OzonReturnCandidate to the ImportOzonReturn shape expected by importOzonReturns.
function toImportPayload(c: OzonReturnCandidate): ImportOzonReturn {
  return {
    postingNumber: c.postingNumber,
    ozonOrderId: c.ozonOrderId,
    returnType: c.returnType,
    returnDate: c.returnDate,
    payoutRub: c.payoutRub,
    returnLogisticFeeRub: c.returnLogisticFeeRub,
    feesSettled: c.feesSettled,
    sellerImpactRub: c.sellerImpactRub,
    items: c.items.map((item) => {
      const mainVariant =
        item.product!.variants.find((v) => v.isMain) ?? item.product!.variants[0];
      return {
        offerId: item.offerId,
        ozonSku: item.ozonSku,
        quantity: item.quantity,
        priceRub: item.priceRub,
        priceWithoutCommissionRub: item.priceWithoutCommissionRub,
        productId: item.product!.id,
        variantId: mainVariant.id,
      };
    }),
  };
}

// ImportOzonReturnsClient renders date-range fetch, return candidate cards with
// checkboxes, financial breakdown, and bulk import button.
export function ImportOzonReturnsClient({ partnerId }: { partnerId: string }) {
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(sixMonthsAgo);
  const [toDate, setToDate] = useState(today);
  const [candidates, setCandidates] = useState<OzonReturnCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedRaw, setExpandedRaw] = useState<Set<string>>(new Set());
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isFetching, startFetch] = useTransition();
  const [isImporting, startImport] = useTransition();

  function handleFetch() {
    setFetchError(null);
    setImportError(null);
    startFetch(async () => {
      const result = await fetchOzonReturnCandidates(fromDate, toDate);
      if ("error" in result) {
        setFetchError(result.error);
        return;
      }
      setCandidates(result.candidates);
      setSelected(new Set());
      setExpandedRaw(new Set());
      setHasFetched(true);
    });
  }

  function toggleSelect(postingNumber: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(postingNumber)) { next.delete(postingNumber); } else { next.add(postingNumber); }
      return next;
    });
  }

  function toggleRaw(postingNumber: string) {
    setExpandedRaw((prev) => {
      const next = new Set(prev);
      if (next.has(postingNumber)) { next.delete(postingNumber); } else { next.add(postingNumber); }
      return next;
    });
  }

  const readyCandidates = candidates.filter(isReady);
  const selectedReady = readyCandidates.filter((c) => selected.has(c.postingNumber));
  const totalImpact = selectedReady.reduce((s, c) => s + c.sellerImpactRub, 0);
  const allSelected = readyCandidates.length > 0 && selectedReady.length === readyCandidates.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(readyCandidates.map((c) => c.postingNumber)));
    }
  }

  function handleImport() {
    if (selectedReady.length === 0) return;
    setImportError(null);
    startImport(async () => {
      const toImport = selectedReady.map(toImportPayload);
      const result = await importOzonReturns(toImport, partnerId);
      if ("error" in result) {
        setImportError(result.error);
        return;
      }
      const target =
        result.orderIds.length > 0
          ? `/admin?scrollToOrder=${result.orderIds.join(",")}`
          : "/admin";
      router.push(target);
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
              {/* Summary / actions bar */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <p className="text-sm text-slate-500">
                  Найдено: <strong>{candidates.length}</strong>
                  {candidates.length !== readyCandidates.length && (
                    <span className="text-amber-600 ml-1">
                      ({candidates.length - readyCandidates.length} без маппинга)
                    </span>
                  )}
                </p>
                {readyCandidates.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {allSelected ? "Снять всё" : "Выбрать всё"}
                  </button>
                )}
                {selectedReady.length > 0 && (
                  <p className="text-sm font-medium text-red-700">
                    Выбрано: {selectedReady.length} — итого −{fmt(totalImpact)} ₽
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting || selectedReady.length === 0}
                  className="ml-auto border-0 rounded-md text-white cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 p-[5px] w-[220px] text-base"
                >
                  {isImporting
                    ? "Импорт..."
                    : selectedReady.length === 0
                    ? "Импортировать"
                    : `Импортировать (${selectedReady.length})`}
                </button>
              </div>

              {importError && <p className="text-red-600 text-sm mb-3">{importError}</p>}

              {/* Candidate cards */}
              <div className="flex flex-col gap-3">
                {candidates.map((c) => {
                  const ready = isReady(c);
                  const isSelected = selected.has(c.postingNumber);
                  const showRaw = expandedRaw.has(c.postingNumber);

                  return (
                    <div
                      key={c.postingNumber}
                      className={`border rounded-md p-4 shadow-main bg-white ${isSelected ? "border-blue-400" : ""}`}
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3">
                        {ready ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(c.postingNumber)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                        ) : (
                          <span className="w-4 h-4 text-amber-500 text-xs flex items-center">⚠</span>
                        )}
                        <span className="font-mono text-sm font-medium">{c.postingNumber}</span>
                        <span className="text-sm text-slate-500">
                          {c.returnDate ? c.returnDate.slice(0, 10) : "—"}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            c.returnType === "Cancellation"
                              ? "bg-slate-100 text-slate-600"
                              : c.returnType === "FullReturn"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.returnType === "Cancellation"
                            ? "Отмена"
                            : c.returnType === "FullReturn"
                            ? "Отказ"
                            : "Возврат"}
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
                      <div className="mt-1.5 text-xs text-slate-400 italic">
                        {c.returnReasonName}
                      </div>

                      {/* Items */}
                      <div className="mt-3 flex flex-col gap-1.5">
                        {c.items.map((item, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.offerId}
                            </span>
                            <span className="text-slate-500">
                              {item.quantity} × {fmt(item.priceWithoutCommissionRub)} ₽/шт
                              {item.commissionPercent > 0 && (
                                <span className="text-slate-400 ml-1">(ком. {item.commissionPercent}%)</span>
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
                        <span className="text-slate-400">+</span>
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
