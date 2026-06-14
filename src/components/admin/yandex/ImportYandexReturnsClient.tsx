"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchReturnCandidates } from "@/actions/yandex/fetchReturnCandidates";
import type { ReturnCandidate } from "@/actions/yandex/fetchReturnCandidates";
import { importYandexReturns } from "@/actions/yandex/importYandexReturns";
import type { ImportYandexReturn } from "@/actions/yandex/importYandexReturns";

function fmt(n: number): string {
  return Math.abs(n).toLocaleString("ru-RU");
}

// Returns true if all mapped items have a variant selected and priceBeforeDiscount is known.
function isReady(
  c: ReturnCandidate,
  sels: Record<string, Record<string, string>>
): boolean {
  if (c.sellerImpactRub === null) return false;
  const returnSels = sels[c.yandexReturnId] ?? {};
  const mappedItems = c.returnedItems.filter(
    (i) => i.product && i.product.variants.length > 0
  );
  return mappedItems.every((i) => !!returnSels[i.shopSku]);
}

// Auto-selects variants after fetch: single-variant → auto; multi with main → auto.
function buildInitialSelections(
  candidates: ReturnCandidate[]
): Record<string, Record<string, string>> {
  const sels: Record<string, Record<string, string>> = {};
  for (const c of candidates) {
    sels[c.yandexReturnId] = {};
    for (const item of c.returnedItems) {
      if (!item.product || item.product.variants.length === 0) continue;
      if (item.product.variants.length === 1) {
        sels[c.yandexReturnId][item.shopSku] = item.product.variants[0].id;
      } else {
        const main = item.product.variants.find((v) => v.isMain);
        if (main) sels[c.yandexReturnId][item.shopSku] = main.id;
      }
    }
  }
  return sels;
}

// ImportYandexReturnsClient renders the date-range picker, fetches return candidates,
// shows each return's financial impact with variant selection, and imports selected returns.
export function ImportYandexReturnsClient({
  partnerId,
  commissionRate,
}: {
  partnerId: string;
  commissionRate: number;
}) {
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(sixMonthsAgo);
  const [toDate, setToDate] = useState(today);
  const [candidates, setCandidates] = useState<ReturnCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [variantSelections, setVariantSelections] = useState<
    Record<string, Record<string, string>>
  >({});
  const [expandedRaw, setExpandedRaw] = useState<Set<string>>(new Set());
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const router = useRouter();
  const [isFetching, startFetch] = useTransition();
  const [isImporting, startImport] = useTransition();

  function handleFetch() {
    setFetchError(null);
    setImportError(null);
    startFetch(async () => {
      const result = await fetchReturnCandidates(fromDate, toDate, commissionRate);
      if ("error" in result) {
        setFetchError(result.error);
        return;
      }
      const sels = buildInitialSelections(result.candidates);
      setVariantSelections(sels);
      setCandidates(result.candidates);
      setSelectedIds(new Set());
      setExpandedRaw(new Set());
      setHasFetched(true);
    });
  }

  function toggleRaw(id: string) {
    setExpandedRaw((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleReturn(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function setVariant(returnId: string, shopSku: string, variantId: string) {
    setVariantSelections((prev) => ({
      ...prev,
      [returnId]: { ...prev[returnId], [shopSku]: variantId },
    }));
  }

  function handleImport() {
    setImportError(null);
    startImport(async () => {
      const toImport: ImportYandexReturn[] = candidates
        .filter((c) => selectedIds.has(c.yandexReturnId) && isReady(c, variantSelections))
        .map((c) => ({
          yandexReturnId: c.yandexReturnId,
          yandexOrderId: c.yandexOrderId,
          returnType: c.returnType,
          refundStatus: c.refundStatus,
          shipmentStatus: c.shipmentStatus,
          buyerRefundRub: c.buyerRefundRub,
          sellerImpactRub: c.sellerImpactRub!,
          creationDate: c.creationDate,
          items: c.returnedItems
            .filter(
              (item) =>
                item.product &&
                item.product.variants.length > 0 &&
                variantSelections[c.yandexReturnId]?.[item.shopSku] &&
                item.priceBeforeDiscount !== null
            )
            .map((item) => ({
              shopSku: item.shopSku,
              count: item.count,
              priceBeforeDiscount: item.priceBeforeDiscount!,
              productId: item.product!.id,
              variantId: variantSelections[c.yandexReturnId][item.shopSku],
            })),
        }));

      const result = await importYandexReturns(toImport, partnerId);
      if ("error" in result) {
        setImportError(result.error);
        return;
      }
      const target = result.orderIds.length > 0
        ? `/admin?scrollToOrder=${result.orderIds.join(",")}`
        : "/admin";
      router.push(target);
    });
  }

  const readyCandidates = candidates.filter((c) => isReady(c, variantSelections));
  const selectedReady = candidates.filter(
    (c) => selectedIds.has(c.yandexReturnId) && isReady(c, variantSelections)
  );
  const totalImpact = selectedReady.reduce((s, c) => s + c.sellerImpactRub!, 0);

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
            <p className="text-slate-500 text-sm">Нет новых возвратов за выбранный период</p>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">
                    Найдено {candidates.length}, готовы к импорту: {readyCandidates.length}
                  </p>
                  {readyCandidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(
                          selectedReady.length === readyCandidates.length
                            ? new Set()
                            : new Set(readyCandidates.map((c) => c.yandexReturnId))
                        )
                      }
                      className="text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      {selectedReady.length === readyCandidates.length ? "Снять всё" : "Выбрать всё"}
                    </button>
                  )}
                </div>
                {selectedReady.length > 0 && (
                  <p className="text-sm font-medium text-red-700">
                    Выбрано: {selectedReady.length} — итого −{fmt(totalImpact)} ₽
                  </p>
                )}
              </div>

              {/* Return cards */}
              <div className="flex flex-col gap-3">
                {candidates.map((c) => {
                  const ready = isReady(c, variantSelections);
                  const isSelected = selectedIds.has(c.yandexReturnId);
                  const isReturn = c.returnType === "RETURN";
                  const showRaw = expandedRaw.has(c.yandexReturnId);

                  return (
                    <div
                      key={c.yandexReturnId}
                      className={`border rounded-md p-4 shadow-main transition-colors ${
                        isSelected ? "border-red-300 bg-red-50/20" : "bg-white"
                      } ${!ready ? "opacity-60" : ""}`}
                    >
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleReturn(c.yandexReturnId)}
                          disabled={!ready}
                          className="w-4 h-4 accent-red-600"
                          title={!ready ? "Выберите вариант для всех товаров" : undefined}
                        />
                        <span className="font-mono text-sm font-medium">
                          #{c.yandexReturnId}
                        </span>
                        <span className="text-sm text-slate-500">
                          {c.creationDate ? c.creationDate.slice(0, 10) : "—"}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isReturn
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isReturn ? "RETURN" : "UNREDEEMED"}
                        </span>
                        {c.refundStatus && (
                          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                            {c.refundStatus}
                          </span>
                        )}
                        {c.shipmentStatus && (
                          <span className="text-xs text-slate-400">{c.shipmentStatus}</span>
                        )}
                        <span className="ml-auto text-sm text-slate-500">
                          Яндекс заказ #{c.yandexOrderId}
                          {c.originalOrder && (
                            <span className="ml-2 text-emerald-700 font-medium">
                              → наш #{c.originalOrder.year}-{c.originalOrder.sequenceNumber}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Financial details */}
                      <div className="mt-2 pl-7 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                        <span>Возврат покупателю: {fmt(c.buyerRefundRub)} ₽</span>
                        {c.sellerImpactRub !== null ? (
                          <span className="text-red-600 font-medium">
                            Возврат от продавца: {fmt(c.sellerImpactRub)} ₽
                            <span className="ml-1 font-normal text-slate-400">
                              (−priceBeforeDiscount × {100 - commissionRate}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-amber-600">
                            ⚠ Нет priceBeforeDiscount — заказ не найден в API Яндекс
                          </span>
                        )}
                      </div>

                      {/* Returned items with variant selection */}
                      <div className="mt-3 flex flex-col gap-2 pl-7">
                        {c.returnedItems.map((item, idx) => {
                          const netPerItem = item.priceBeforeDiscount !== null
                            ? Math.round(item.priceBeforeDiscount * (1 - commissionRate / 100))
                            : null;
                          return (
                            <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.shopSku}
                              </span>
                              {netPerItem !== null ? (
                                <span className="text-slate-500">
                                  {item.count} × −{fmt(netPerItem)} ₽/шт = −{fmt(item.count * netPerItem)} ₽
                                </span>
                              ) : (
                                <span className="text-amber-600 text-xs">⚠ priceBeforeDiscount неизвестен</span>
                              )}
                              {!item.product ? (
                                <span className="text-amber-600 text-xs">⚠ Товар не найден</span>
                              ) : item.product.variants.length === 0 ? (
                                <span className="text-amber-600 text-xs">⚠ Нет вариантов</span>
                              ) : item.product.variants.length === 1 ? (
                                <span className="text-slate-400 text-xs">
                                  {item.product.variants[0].variantName}
                                </span>
                              ) : (
                                <select
                                  value={variantSelections[c.yandexReturnId]?.[item.shopSku] ?? ""}
                                  onChange={(e) =>
                                    setVariant(c.yandexReturnId, item.shopSku, e.target.value)
                                  }
                                  className="admin-form-input text-xs py-0.5 w-48"
                                >
                                  {!variantSelections[c.yandexReturnId]?.[item.shopSku] && (
                                    <option value="">Выберите вариант...</option>
                                  )}
                                  {item.product.variants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.variantName}{v.isMain ? " (основной)" : ""}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Raw data toggle */}
                      <div className="mt-3 pl-7">
                        <button
                          type="button"
                          onClick={() => toggleRaw(c.yandexReturnId)}
                          className="text-xs text-slate-400 hover:text-slate-600 underline"
                        >
                          {showRaw ? "Скрыть сырые данные" : "Показать сырые данные Яндекс"}
                        </button>
                        {showRaw && (
                          <div className="mt-2 bg-slate-50 rounded p-3 text-xs font-mono space-y-1 overflow-x-auto">
                            <p className="font-semibold text-slate-600 mb-1">Возврат из API:</p>
                            <div className="text-slate-500">
                              returnId: {c.yandexReturnId}
                              {" · "}orderId: {c.yandexOrderId}
                              {" · "}type: {c.returnType}
                              {" · "}refundStatus: {c.refundStatus ?? "—"}
                              {" · "}shipmentStatus: {c.shipmentStatus ?? "—"}
                              {" · "}buyerRefund: {c.buyerRefundRub} ₽
                            </div>
                            <p className="font-semibold text-slate-600 mt-2 mb-1">Возвращённые товары (priceBeforeDiscount из заказа):</p>
                            {c.returnedItems.map((item, idx) => (
                              <div key={idx} className="text-slate-500">
                                <span className="text-slate-700">{item.shopSku}</span>
                                {" · "}qty: {item.count}
                                {" · "}priceBeforeDiscount: {item.priceBeforeDiscount ?? "неизвестно"}
                                {item.priceBeforeDiscount !== null && (
                                  <span>
                                    {" · "}net/шт: {fmt(Math.round(item.priceBeforeDiscount * (1 - commissionRate / 100)))} ₽
                                    {" · "}impact: −{fmt(Math.round(item.priceBeforeDiscount * item.count * (1 - commissionRate / 100)))} ₽
                                  </span>
                                )}
                              </div>
                            ))}
                            {c.sellerImpactRub !== null && (
                              <div className="text-red-600 mt-1 font-semibold">
                                Итого: {fmt(Math.abs(c.sellerImpactRub))} ₽
                                <span className="font-normal text-slate-500 ml-2">
                                  (−priceBeforeDiscount × {100 - commissionRate}%)
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Import button */}
              <div className="mt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting || selectedReady.length === 0}
                  className="border-0 rounded-md text-white cursor-pointer bg-red-500 hover:bg-red-600 disabled:bg-slate-300 p-[10px] px-6 text-base"
                >
                  {isImporting
                    ? "Импорт..."
                    : `Импортировать выбранные (${selectedReady.length})`}
                </button>
                {importError && (
                  <p className="text-red-600 text-sm">{importError}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
