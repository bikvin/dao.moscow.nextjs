"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OzonOrderCandidate, SkippedEntry } from "@/actions/ozon/fetchOzonOrderCandidates";
import { fetchOzonOrderCandidates } from "@/actions/ozon/fetchOzonOrderCandidates";
import type { ImportOzonOrder, ImportOzonOrderItem, ImportOzonOrderGroup } from "@/actions/ozon/importOzonOrders";
import { importOzonOrders, importOzonOrderGroup } from "@/actions/ozon/importOzonOrders";
import { skipCandidate, unskipCandidate } from "@/actions/common/skipCandidate";
import { SkippedCandidateSource } from "@prisma/client";

// Net revenue for the whole order.
// If payout is known: exact fees or avgServiceFee×units as estimate.
// If payout is 0 (financial_data not yet populated): estimate from buyer price × commission rate.
function calcNet(
  c: OzonOrderCandidate,
  avgServiceFee: number,
  avgCommissionPercent: number
): { value: number; exact: boolean; noData: boolean } {
  const totalOzonUnits = c.items.reduce((s, i) => s + i.quantity, 0);

  if (c.totalPayout === 0 && c.isBuyout) return { value: 0, exact: false, noData: true };

  if (c.totalPayout === 0) {
    const estimatedPayout = c.totalBuyerPrice * (1 - avgCommissionPercent / 100);
    const estimatedFees = avgServiceFee * totalOzonUnits;
    return { value: Math.round(estimatedPayout - estimatedFees), exact: false, noData: false };
  }

  const fees = c.serviceFeesBreakdown !== null
    ? c.serviceFeesBreakdown.total
    : avgServiceFee * totalOzonUnits;
  return {
    value: Math.round(c.totalPayout - fees),
    exact: c.serviceFeesBreakdown !== null,
    noData: false,
  };
}

// Net per Ozon unit for a single item.
// Returns null only for buyout orders with no payout data; otherwise estimates from commission rate.
function calcItemNet(
  item: OzonOrderCandidate["items"][number],
  c: OzonOrderCandidate,
  avgServiceFee: number,
  avgCommissionPercent: number
): number | null {
  if (item.payout === 0 && c.isBuyout) return null;

  if (item.payout === 0) {
    const estimatedPayoutPerUnit = item.buyerPrice * (1 - avgCommissionPercent / 100);
    return Math.round(estimatedPayoutPerUnit - avgServiceFee);
  }

  const totalOzonUnits = c.items.reduce((s, i) => s + i.quantity, 0);
  const fees = c.serviceFeesBreakdown !== null
    ? c.serviceFeesBreakdown.total
    : avgServiceFee * totalOzonUnits;
  return Math.round(item.payout / item.quantity - fees / totalOzonUnits);
}

// Returns true if all importable items (with a matched product) have a variant selected.
function isOrderReady(
  c: OzonOrderCandidate,
  sels: Record<string, Record<string, string>>
): boolean {
  const orderSels = sels[c.postingNumber] ?? {};
  const importableItems = c.items.filter(
    (i) => i.product && i.product.variants.length > 0
  );
  if (importableItems.length === 0) return false;
  return importableItems.every((i) => !!orderSels[i.offerId]);
}

// Auto-initialises variant selections: single-variant → auto-select; multi with main → auto-select main.
function buildInitialSelections(
  candidates: OzonOrderCandidate[]
): Record<string, Record<string, string>> {
  const sels: Record<string, Record<string, string>> = {};
  for (const c of candidates) {
    sels[c.postingNumber] = {};
    for (const item of c.items) {
      if (!item.product || item.product.variants.length === 0) continue;
      if (item.product.variants.length === 1) {
        sels[c.postingNumber][item.offerId] = item.product.variants[0].id;
      } else {
        const main = item.product.variants.find((v) => v.isMain);
        if (main) sels[c.postingNumber][item.offerId] = main.id;
      }
    }
  }
  return sels;
}

function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

const ACTIVE_OZON_STATUSES = new Set([
  "awaiting_packaging",
  "awaiting_deliver",
  "delivering",
  "arbitration",
  "client_arbitration",
]);

const OZON_STATUS_KEYS = [
  "awaiting_packaging",
  "awaiting_deliver",
  "delivering",
  "delivered",
  "arbitration",
  "client_arbitration",
  "cancelled",
];

export function ImportOzonOrdersClient({
  partnerId,
  avgServiceFee,
  avgCommissionPercent,
}: {
  partnerId: string;
  avgServiceFee: number;
  avgCommissionPercent: number;
}) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(tomorrow);
  const [statusFilter, setStatusFilter] = useState("active");
  const [candidates, setCandidates] = useState<OzonOrderCandidate[]>([]);
  const [skippedList, setSkippedList] = useState<SkippedEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"new" | "skipped">("new");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // variantSelections[postingNumber][offerId] = variantId
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
      const result = await fetchOzonOrderCandidates(fromDate, toDate);
      if ("error" in result) {
        setFetchError(result.error);
        return;
      }
      const sels = buildInitialSelections(result.candidates);
      setVariantSelections(sels);
      setCandidates(result.candidates);
      setSkippedList(result.skipped);
      setSelectedIds(new Set());
      setExpandedRaw(new Set());
      setHasFetched(true);
    });
  }

  function toggleOrder(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
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

  function setVariant(postingNumber: string, offerId: string, variantId: string) {
    setVariantSelections((prev) => ({
      ...prev,
      [postingNumber]: { ...prev[postingNumber], [offerId]: variantId },
    }));
  }

  function buildPostingPayload(c: OzonOrderCandidate): ImportOzonOrder {
    return {
      postingNumber: c.postingNumber,
      orderDate: c.orderDate,
      mappedStatus: c.mappedStatus,
      city: c.city,
      shipmentDate: c.shipmentDate,
      totalBuyerPrice: c.totalBuyerPrice,
      totalPayout: c.totalPayout,
      serviceFeesBreakdown: c.serviceFeesBreakdown,
      items: c.items
        .filter(
          (item) =>
            item.product &&
            item.product.variants.length > 0 &&
            variantSelections[c.postingNumber]?.[item.offerId]
        )
        .map((item): ImportOzonOrderItem => ({
          ...item,
          productId: item.product!.id,
          variantId: variantSelections[c.postingNumber][item.offerId],
        })),
    };
  }

  function handleImport() {
    setImportError(null);
    startImport(async () => {
      const allOrderIds: string[] = [];

      // Split selected candidates into individual postings vs. multi-posting groups.
      const selectedGroups = candidateGroups.filter(
        (g) => g.postings.some((c) => selectedIds.has(c.postingNumber)) && isGroupReady(g)
      );

      for (const group of selectedGroups) {
        if (group.postings.length === 1) {
          const result = await importOzonOrders([buildPostingPayload(group.postings[0])], partnerId);
          if ("error" in result) { setImportError(result.error); return; }
          allOrderIds.push(...result.orderIds);
        } else {
          const payload: ImportOzonOrderGroup = {
            orderNumber: group.orderNumber,
            postings: group.postings.map(buildPostingPayload),
          };
          const result = await importOzonOrderGroup(payload, partnerId);
          if ("error" in result) { setImportError(result.error); return; }
          allOrderIds.push(result.orderId);
        }
      }

      const target = allOrderIds.length > 0
        ? `/admin?scrollToOrder=${allOrderIds.join(",")}`
        : "/admin";
      router.push(target);
    });
  }

  async function handleSkip(c: OzonOrderCandidate) {
    const label = `${c.postingNumber} · ${new Date(c.orderDate).toLocaleDateString("ru-RU")}`;
    await skipCandidate(SkippedCandidateSource.OZON_ORDER, c.postingNumber, label);
    setCandidates((prev) => prev.filter((x) => x.postingNumber !== c.postingNumber));
    setSkippedList((prev) => [...prev, { externalId: c.postingNumber, label, skippedAt: new Date().toISOString() }]);
  }

  async function handleUnskip(externalId: string) {
    await unskipCandidate(SkippedCandidateSource.OZON_ORDER, externalId);
    setSkippedList((prev) => prev.filter((x) => x.externalId !== externalId));
  }

  type CandidateGroup = { orderNumber: string; postings: OzonOrderCandidate[] };

  // Skips all postings in a multi-posting group at once.
  async function handleSkipGroup(group: CandidateGroup) {
    const now = new Date().toISOString();
    for (const c of group.postings) {
      const label = `${c.postingNumber} · ${new Date(c.orderDate).toLocaleDateString("ru-RU")}`;
      await skipCandidate(SkippedCandidateSource.OZON_ORDER, c.postingNumber, label);
      setSkippedList((prev) => [...prev, { externalId: c.postingNumber, label, skippedAt: now }]);
    }
    const ids = new Set(group.postings.map((c) => c.postingNumber));
    setCandidates((prev) => prev.filter((x) => !ids.has(x.postingNumber)));
  }

  const visibleCandidates =
    statusFilter === "all"
      ? candidates
      : statusFilter === "active"
      ? candidates.filter((c) => ACTIVE_OZON_STATUSES.has(c.ozonStatus))
      : candidates.filter((c) => c.ozonStatus === statusFilter);

  // Group visible candidates by orderNumber. Multi-posting groups show a merged card.
  const groupMap = new Map<string, OzonOrderCandidate[]>();
  for (const c of visibleCandidates) {
    const key = c.orderNumber || c.postingNumber; // fallback for orders without order_number
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(c);
  }
  const candidateGroups: CandidateGroup[] = [...groupMap.entries()].map(([orderNumber, postings]) => ({
    orderNumber,
    postings,
  }));

  // A single-posting group is ready when its posting is ready.
  // A multi-posting group is ready when ALL postings are ready.
  function isGroupReady(group: CandidateGroup): boolean {
    return group.postings.every((c) => isOrderReady(c, variantSelections));
  }

  // A group is selected when ALL its postings are in selectedIds.
  function isGroupSelected(group: CandidateGroup): boolean {
    return group.postings.every((c) => selectedIds.has(c.postingNumber));
  }

  function toggleGroup(group: CandidateGroup) {
    const allSelected = isGroupSelected(group);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of group.postings) {
        if (allSelected) { next.delete(c.postingNumber); } else { next.add(c.postingNumber); }
      }
      return next;
    });
  }

  const readyCandidates = visibleCandidates.filter((c) => isOrderReady(c, variantSelections));
  const selectedReady = visibleCandidates.filter(
    (c) => selectedIds.has(c.postingNumber) && isOrderReady(c, variantSelections)
  );
  const selectedBuyerTotal = selectedReady.reduce((s, c) => s + c.totalBuyerPrice, 0);
  const selectedWithData = selectedReady.filter((c) => c.totalPayout > 0);
  const selectedNetTotal = selectedWithData.reduce(
    (s, c) => s + calcNet(c, avgServiceFee, avgCommissionPercent).value,
    0
  );

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
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Статус</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-form-input text-sm"
          >
            <option value="active">Активные</option>
            <option value="all">Все</option>
            <optgroup label="По статусу Ozon">
              {OZON_STATUS_KEYS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={isFetching}
          className="border-0 rounded-md text-white cursor-pointer bg-green-500 hover:bg-green-600 disabled:bg-slate-300 p-[5px] w-[160px] text-base"
        >
          {isFetching ? "Загрузка..." : "Загрузить заказы"}
        </button>
      </div>

      {fetchError && (
        <p className="text-red-600 text-sm mt-3">{fetchError}</p>
      )}

      {/* Results */}
      {hasFetched && (
        <div className="mt-6">
          {/* Tab switcher */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "new"
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Новые
              {candidates.length > 0 && (
                <span className="ml-1 text-slate-400 font-normal">
                  ({candidates.length} / {visibleCandidates.length} видно)
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("skipped")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "skipped"
                  ? "border-slate-500 text-slate-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Загруженные вручную{skippedList.length > 0 && ` (${skippedList.length})`}
            </button>
          </div>

          {activeTab === "skipped" ? (
            skippedList.length === 0 ? (
              <p className="text-slate-500 text-sm">Нет заказов, отмеченных как загруженные вручную</p>
            ) : (
              <div className="flex flex-col gap-2">
                {skippedList.map((s) => (
                  <div key={s.externalId} className="border rounded-md p-3 bg-slate-50 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-sm font-medium">{s.externalId}</span>
                      <span className="text-xs text-slate-400 ml-3">
                        {new Date(s.skippedAt).toLocaleDateString("ru-RU")}
                      </span>
                      <span className="text-xs text-slate-500 ml-3">{s.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnskip(s.externalId)}
                      className="text-xs text-blue-500 hover:text-blue-700 underline whitespace-nowrap"
                    >
                      Восстановить
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : visibleCandidates.length === 0 ? (
            <p className="text-slate-500 text-sm">
              {candidates.length === 0
                ? "Нет новых заказов за выбранный период"
                : "Нет заказов с активным статусом — переключите фильтр на «Все»"}
            </p>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">
                    Найдено {visibleCandidates.length} заказов, готовы к импорту: {readyCandidates.length}
                    {statusFilter === "active" && candidates.length > visibleCandidates.length && (
                      <span className="ml-2 text-slate-400">
                        ({candidates.length - visibleCandidates.length} скрыто фильтром)
                      </span>
                    )}
                  </p>
                  {readyCandidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(
                          selectedReady.length === readyCandidates.length
                            ? new Set()
                            : new Set(readyCandidates.map((c) => c.postingNumber))
                        )
                      }
                      className="text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      {selectedReady.length === readyCandidates.length ? "Снять всё" : "Выбрать всё"}
                    </button>
                  )}
                </div>
                {selectedReady.length > 0 && (
                  <p className="text-sm font-medium">
                    Выбрано: {selectedReady.length} заказов —{" "}
                    {fmt(Math.round(selectedBuyerTotal))} ₽ покупатель
                    {selectedWithData.length > 0 && (
                      <>
                        ,{" "}≈{fmt(selectedNetTotal)} ₽ чистыми
                        {selectedWithData.length < selectedReady.length && (
                          <span className="ml-1 text-slate-400 font-normal text-xs">
                            (по {selectedWithData.length} из {selectedReady.length})
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Order cards */}
              <div className="flex flex-col gap-3">
                {candidateGroups.map((group) => {
                  if (group.postings.length === 1) {
                    // Single-posting: render the standard card.
                    const c = group.postings[0];
                    const ready = isOrderReady(c, variantSelections);
                    const net = calcNet(c, avgServiceFee, avgCommissionPercent);
                    const isSelected = selectedIds.has(c.postingNumber);
                    const hasUnmapped = c.items.some((i) => !i.product);
                    const showRaw = expandedRaw.has(c.postingNumber);
                    const totalCommission = c.items.reduce((s, i) => s + i.commissionAmount, 0);

                    return (
                      <div
                        key={c.postingNumber}
                        className={`border rounded-md p-4 shadow-main transition-colors ${
                          isSelected ? "border-emerald-400 bg-emerald-50/30" : "bg-white"
                        } ${!ready ? "opacity-70" : ""}`}
                      >
                        {/* Order header row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOrder(c.postingNumber)}
                            disabled={!ready}
                            className="w-4 h-4 accent-emerald-600"
                            title={!ready ? "Выберите вариант для всех товаров" : undefined}
                          />
                          <span className="font-mono text-sm font-medium">
                            {c.postingNumber}
                          </span>
                          <span className="text-sm text-slate-500">
                            {c.orderDate.slice(0, 10)}
                          </span>
                          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                            {c.ozonStatus}
                          </span>
                          {c.isBuyout && (
                            <span className="text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                              ЕАЭС выкуп
                            </span>
                          )}
                          {c.city && (
                            <span className="text-xs text-slate-400">{c.city}</span>
                          )}
                          <span className="ml-auto text-sm font-medium">
                            {fmt(Math.round(c.totalBuyerPrice))} ₽
                          </span>
                          {net.noData ? (
                            <span className="text-sm text-slate-400">
                              Фин. данные недоступны
                              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-normal">
                                нет данных
                              </span>
                            </span>
                          ) : (
                            <span
                              className={`text-sm ${net.exact ? "text-emerald-700 font-medium" : "text-slate-500"}`}
                            >
                              {net.exact ? "" : "≈"}{fmt(net.value)} ₽ чистыми
                              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded font-normal ${net.exact ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                {net.exact ? "факт" : "оценка"}
                              </span>
                              {c.totalBuyerPrice > 0 && (
                                <span className="ml-1.5 text-xs text-slate-400">
                                  ({(100 * (c.totalBuyerPrice - net.value) / c.totalBuyerPrice).toFixed(1)}% издержки)
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Fee breakdown */}
                        <div className="mt-2 pl-7 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                          <span>Покупатель заплатил: {fmt(Math.round(c.totalBuyerPrice))} ₽</span>
                          {net.noData ? (
                            <span className="text-amber-600">Финансовые данные недоступны</span>
                          ) : c.totalPayout === 0 ? (
                            <>
                              <span className="text-slate-400">
                                Выплата: оценка ≈ {fmt(Math.round(c.totalBuyerPrice * (1 - avgCommissionPercent / 100)))} ₽
                                <span className="ml-1 text-slate-300">(комиссия {avgCommissionPercent}%)</span>
                              </span>
                              <span className="text-slate-400">
                                Сервисные сборы (оценка): −{fmt(Math.round(avgServiceFee * c.items.reduce((s, i) => s + i.quantity, 0)))} ₽
                              </span>
                            </>
                          ) : (
                            <>
                              <span>Выплата (после комиссии): {fmt(Math.round(c.totalPayout))} ₽</span>
                              <span>
                                Комиссия Ozon: −{fmt(Math.round(Math.abs(totalCommission)))} ₽
                                {c.items[0]?.commissionPercent > 0 && ` (${c.items[0].commissionPercent.toFixed(1)}%)`}
                                <span className="ml-1 text-emerald-600">факт</span>
                              </span>
                              {c.serviceFeesBreakdown ? (
                                <>
                                  {c.serviceFeesBreakdown.logisticsRub > 0 && (
                                    <span>Логистика: −{fmt(Math.round(c.serviceFeesBreakdown.logisticsRub))} ₽</span>
                                  )}
                                  {c.serviceFeesBreakdown.lastMileRub > 0 && (
                                    <span>Последняя миля: −{fmt(Math.round(c.serviceFeesBreakdown.lastMileRub))} ₽</span>
                                  )}
                                  {c.serviceFeesBreakdown.dropoffRub > 0 && (
                                    <span>Dropoff: −{fmt(Math.round(c.serviceFeesBreakdown.dropoffRub))} ₽</span>
                                  )}
                                  {c.serviceFeesBreakdown.starsMembershipRub > 0 && (
                                    <span>Stars: −{fmt(Math.round(c.serviceFeesBreakdown.starsMembershipRub))} ₽</span>
                                  )}
                                  {c.serviceFeesBreakdown.acquiringRub > 0 && (
                                    <span>Эквайринг: −{fmt(Math.round(c.serviceFeesBreakdown.acquiringRub))} ₽</span>
                                  )}
                                  <span className="text-emerald-600">Сервисные сборы: факт</span>
                                </>
                              ) : (
                                <span>Сервисные сборы (оценка): −{fmt(Math.round(avgServiceFee))} ₽</span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Items */}
                        <div className="mt-3 flex flex-col gap-2 pl-7">
                          {c.items.map((item) => {
                            const itemNet = calcItemNet(item, c, avgServiceFee, avgCommissionPercent);
                            return (
                              <div key={item.offerId} className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.offerId}
                                </span>
                                <span className="text-slate-400 text-xs truncate max-w-[200px]">
                                  {item.name}
                                </span>
                                <span className="text-slate-500">
                                  {itemNet === null
                                    ? `${item.quantity} шт (цена уточнится)`
                                    : item.payout > 0 && c.serviceFeesBreakdown !== null
                                      ? `${item.quantity} × ${fmt(itemNet)} ₽/шт = ${fmt(item.quantity * itemNet)} ₽`
                                      : `${item.quantity} × ≈${fmt(itemNet)} ₽/шт = ≈${fmt(item.quantity * itemNet)} ₽`}
                                </span>

                                {!item.product ? (
                                  <span className="text-amber-600 text-xs">
                                    ⚠ Товар не найден — будет пропущен
                                  </span>
                                ) : item.product.variants.length === 0 ? (
                                  <span className="text-amber-600 text-xs">
                                    ⚠ Нет вариантов — будет пропущен
                                  </span>
                                ) : item.product.variants.length === 1 ? (
                                  <span className="text-slate-400 text-xs">
                                    {item.product.variants[0].variantName}
                                  </span>
                                ) : (
                                  <select
                                    value={variantSelections[c.postingNumber]?.[item.offerId] ?? ""}
                                    onChange={(e) =>
                                      setVariant(c.postingNumber, item.offerId, e.target.value)
                                    }
                                    className="admin-form-input text-xs py-0.5 w-48"
                                  >
                                    {!variantSelections[c.postingNumber]?.[item.offerId] && (
                                      <option value="">Выберите вариант...</option>
                                    )}
                                    {item.product.variants.map((v) => (
                                      <option key={v.id} value={v.id}>
                                        {v.variantName}
                                        {v.isMain ? " (основной)" : ""}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            );
                          })}

                          {hasUnmapped && (
                            <p className="text-xs text-slate-400 mt-1">
                              Товары без SKU будут пропущены при импорте
                            </p>
                          )}
                        </div>

                        {/* Raw data toggle */}
                        <div className="mt-3 pl-7">
                          <button
                            type="button"
                            onClick={() => toggleRaw(c.postingNumber)}
                            className="text-xs text-slate-400 hover:text-slate-600 underline"
                          >
                            {showRaw ? "Скрыть сырые данные" : "Показать сырые данные Ozon"}
                          </button>
                          {showRaw && (
                            <div className="mt-2 bg-slate-50 rounded p-3 text-xs font-mono space-y-1 overflow-x-auto">
                              <p className="font-semibold text-slate-600 mb-1">financial_data (из API):</p>
                              {c.items.map((item) => (
                                <div key={item.offerId} className="text-slate-500">
                                  <span className="text-slate-700">{item.offerId}</span>
                                  {" · "}qty: {item.quantity}
                                  {" · "}buyer_price: {item.buyerPrice}
                                  {" · "}payout: {item.payout}
                                  {" · "}commission: {item.commissionAmount} ({item.commissionPercent}%)
                                </div>
                              ))}
                              {c.serviceFeesBreakdown && (
                                <>
                                  <p className="font-semibold text-slate-600 mt-2 mb-1">Транзакционные сборы (из API):</p>
                                  <div className="text-slate-500">
                                    logisticsRub: {c.serviceFeesBreakdown.logisticsRub}
                                    {" · "}lastMileRub: {c.serviceFeesBreakdown.lastMileRub}
                                    {" · "}dropoffRub: {c.serviceFeesBreakdown.dropoffRub}
                                    {" · "}starsMembershipRub: {c.serviceFeesBreakdown.starsMembershipRub}
                                    {" · "}acquiringRub: {c.serviceFeesBreakdown.acquiringRub}
                                    {" · "}<span className="font-semibold">total: {c.serviceFeesBreakdown.total}</span>
                                  </div>
                                </>
                              )}
                              {!c.serviceFeesBreakdown && c.totalPayout > 0 && (
                                <p className="text-amber-600 mt-1">Транзакционные сборы недоступны — используется оценка {avgServiceFee} ₽</p>
                              )}
                              {c.totalPayout === 0 && !c.isBuyout && (
                                <p className="text-amber-600 mt-1">financial_data пуст — заказ ещё не обработан Ozon</p>
                              )}
                              {c.isBuyout && (
                                <p className="text-violet-600 mt-1">Выкупной заказ ЕАЭС — выплата из /v1/finance/products/buyout, сервисные сборы из транзакций</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSkip(c)}
                            className="text-xs text-slate-400 hover:text-slate-600 underline"
                          >
                            Отметить как загруженный вручную
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Multi-posting group card: multiple split deliveries merged into one order.
                  const groupReady = isGroupReady(group);
                  const groupSelected = isGroupSelected(group);
                  const groupBuyerTotal = group.postings.reduce((s, c) => s + c.totalBuyerPrice, 0);
                  const groupNets = group.postings.map((c) => calcNet(c, avgServiceFee, avgCommissionPercent));
                  const groupNetTotal = groupNets.reduce((s, n) => s + n.value, 0);
                  const allNetsExact = groupNets.every((n) => n.exact);
                  const anyNoData = groupNets.some((n) => n.noData);

                  return (
                    <div
                      key={group.orderNumber}
                      className={`border-2 rounded-md p-4 shadow-main transition-colors ${
                        groupSelected ? "border-emerald-400 bg-emerald-50/30" : "border-indigo-200 bg-white"
                      } ${!groupReady ? "opacity-70" : ""}`}
                    >
                      {/* Group header */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={groupSelected}
                          onChange={() => toggleGroup(group)}
                          disabled={!groupReady}
                          className="w-4 h-4 accent-emerald-600"
                          title={!groupReady ? "Выберите варианты для всех товаров" : undefined}
                        />
                        <span className="font-mono text-sm font-semibold">{group.orderNumber}</span>
                        <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {group.postings.length} отправления · один заказ
                        </span>
                        <span className="ml-auto text-sm font-medium">
                          {fmt(Math.round(groupBuyerTotal))} ₽
                        </span>
                        {!anyNoData && (
                          <span className={`text-sm ${allNetsExact ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                            {allNetsExact ? "" : "≈"}{fmt(groupNetTotal)} ₽ чистыми
                            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded font-normal ${allNetsExact ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                              {allNetsExact ? "факт" : "оценка"}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Individual postings */}
                      <div className="flex flex-col gap-3 pl-3 border-l-2 border-indigo-100">
                        {group.postings.map((c) => {
                          const net = calcNet(c, avgServiceFee, avgCommissionPercent);
                          const showRaw = expandedRaw.has(c.postingNumber);
                          const hasUnmapped = c.items.some((i) => !i.product);

                          return (
                            <div key={c.postingNumber} className="bg-slate-50 rounded border border-slate-200 p-3">
                              {/* Posting header */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="font-mono text-xs font-medium">{c.postingNumber}</span>
                                <span className="text-slate-500 text-xs">{c.orderDate.slice(0, 10)}</span>
                                <span className="text-xs text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded-full border">
                                  {c.ozonStatus}
                                </span>
                                {c.city && <span className="text-xs text-slate-400">{c.city}</span>}
                                <span className="ml-auto text-xs font-medium">
                                  {fmt(Math.round(c.totalBuyerPrice))} ₽
                                </span>
                                {!net.noData && (
                                  <span className={`text-xs ${net.exact ? "text-emerald-700" : "text-slate-400"}`}>
                                    {net.exact ? "" : "≈"}{fmt(net.value)} ₽ чистыми
                                  </span>
                                )}
                              </div>

                              {/* Items */}
                              <div className="flex flex-col gap-1.5">
                                {c.items.map((item) => {
                                  const itemNet = calcItemNet(item, c, avgServiceFee, avgCommissionPercent);
                                  return (
                                    <div key={item.offerId} className="flex flex-wrap items-center gap-2 text-sm pl-2">
                                      <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">
                                        {item.offerId}
                                      </span>
                                      <span className="text-slate-400 text-xs truncate max-w-[200px]">
                                        {item.name}
                                      </span>
                                      <span className="text-slate-500 text-xs">
                                        {itemNet === null
                                          ? `${item.quantity} шт (цена уточнится)`
                                          : `${item.quantity} × ${itemNet > 0 && c.serviceFeesBreakdown !== null ? "" : "≈"}${fmt(itemNet ?? 0)} ₽/шт`}
                                      </span>
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
                                          value={variantSelections[c.postingNumber]?.[item.offerId] ?? ""}
                                          onChange={(e) => setVariant(c.postingNumber, item.offerId, e.target.value)}
                                          className="admin-form-input text-xs py-0.5 w-48"
                                        >
                                          {!variantSelections[c.postingNumber]?.[item.offerId] && (
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
                                {hasUnmapped && (
                                  <p className="text-xs text-slate-400 pl-2 mt-0.5">
                                    Товары без SKU будут пропущены при импорте
                                  </p>
                                )}
                              </div>

                              {/* Raw data toggle */}
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => toggleRaw(c.postingNumber)}
                                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                                >
                                  {showRaw ? "Скрыть сырые данные" : "Сырые данные Ozon"}
                                </button>
                                {showRaw && (
                                  <div className="mt-2 bg-white rounded p-2 text-xs font-mono overflow-x-auto">
                                    {c.items.map((item) => (
                                      <div key={item.offerId} className="text-slate-500">
                                        <span className="text-slate-700">{item.offerId}</span>
                                        {" · "}qty: {item.quantity}
                                        {" · "}buyer_price: {item.buyerPrice}
                                        {" · "}payout: {item.payout}
                                        {" · "}commission: {item.commissionAmount} ({item.commissionPercent}%)
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Group footer */}
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-indigo-600 font-medium">
                          Отправления будут объединены в один заказ при импорте
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSkipGroup(group)}
                          className="text-xs text-slate-400 hover:text-slate-600 underline"
                        >
                          Отметить как загруженный вручную
                        </button>
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
                  className="border-0 rounded-md text-white cursor-pointer bg-green-500 hover:bg-green-600 disabled:bg-slate-300 p-[10px] px-6 text-base"
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
