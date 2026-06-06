"use client";

import { useState, useTransition } from "react";
import type { OrderCandidate } from "@/actions/yandex/fetchOrderCandidates";
import { fetchOrderCandidates } from "@/actions/yandex/fetchOrderCandidates";
import type { ImportOrder } from "@/actions/yandex/importYandexOrders";
import { importYandexOrders } from "@/actions/yandex/importYandexOrders";


// Calculates the other (non-commission) fees for an order — used in both order-level and
// per-item net calculations.
// Settled: sum of all non-FEE commissions from the stats API.
// Unsettled: avgDelivery × totalUnits (per-unit estimate).
function calcOtherFees(c: OrderCandidate, avgDelivery: number): number {
  if (c.feesSettled) {
    const f = c.fees;
    return f.deliveryRub + f.expressDeliveryRub + f.crossDeliveryRub +
      f.paymentTransferRub + f.agencyRub + f.loyaltyFeeRub + f.sortingRub;
  }
  const totalUnits = c.items.reduce((s, i) => s + i.count, 0);
  return avgDelivery * totalUnits;
}

// Calculates net revenue for the whole order.
// Commission is based on buyerTotalBeforeDiscount (listed retail price) × rate.
// Other fees come from calcOtherFees.
function calcNet(
  c: OrderCandidate,
  commissionRate: number,
  avgDelivery: number
): { value: number; exact: boolean } {
  const commission = (c.buyerTotalBeforeDiscount * commissionRate) / 100;
  const otherFees = calcOtherFees(c, avgDelivery);
  return {
    value: Math.round(c.buyerTotalBeforeDiscount - commission - otherFees),
    exact: c.feesSettled,
  };
}

// Calculates net revenue per unit for a single item.
// Commission = item.priceBeforeDiscount × rate (same basis as order-level commission).
// Other fees are distributed equally across all units in the order.
function calcItemNet(
  item: OrderCandidate["items"][number],
  c: OrderCandidate,
  commissionRate: number,
  avgDelivery: number
): number {
  const totalUnits = c.items.reduce((s, i) => s + i.count, 0);
  const commission = (item.priceBeforeDiscount * commissionRate) / 100;
  const otherFeePerUnit = calcOtherFees(c, avgDelivery) / totalUnits;
  return Math.round(item.priceBeforeDiscount - commission - otherFeePerUnit);
}

// Returns true if all items with a mapped product have a variant selected.
// Items with no product match are skipped (they won't be imported).
// Orders with zero importable items are not importable.
function isOrderReady(
  c: OrderCandidate,
  sels: Record<string, Record<string, string>>
): boolean {
  const orderSels = sels[c.yandexOrderId] ?? {};
  const importableItems = c.items.filter(
    (i) => i.product && i.product.variants.length > 0
  );
  if (importableItems.length === 0) return false;
  return importableItems.every((i) => !!orderSels[i.offerId]);
}

// Auto-initialises variant selections after fetch:
// - Single-variant product → auto-select the only variant
// - Multi-variant product with a main variant → auto-select main
// - Multi-variant product with no main → leave blank (user must choose)
function buildInitialSelections(
  candidates: OrderCandidate[]
): Record<string, Record<string, string>> {
  const sels: Record<string, Record<string, string>> = {};
  for (const c of candidates) {
    sels[c.yandexOrderId] = {};
    for (const item of c.items) {
      if (!item.product || item.product.variants.length === 0) continue;
      if (item.product.variants.length === 1) {
        sels[c.yandexOrderId][item.offerId] = item.product.variants[0].id;
      } else {
        const main = item.product.variants.find((v) => v.isMain);
        if (main) sels[c.yandexOrderId][item.offerId] = main.id;
      }
    }
  }
  return sels;
}

function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function ImportOrdersClient({
  partnerId,
  commissionRate,
  avgDelivery,
}: {
  partnerId: string;
  commissionRate: number;
  avgDelivery: number;
}) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(tomorrow);
  const [statusFilter, setStatusFilter] = useState("active");
  const [candidates, setCandidates] = useState<OrderCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // variantSelections[yandexOrderId][offerId] = variantId
  const [variantSelections, setVariantSelections] = useState<
    Record<string, Record<string, string>>
  >({});
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const [isFetching, startFetch] = useTransition();
  const [isImporting, startImport] = useTransition();

  function handleFetch() {
    setFetchError(null);
    setImportError(null);
    setImportSuccess(null);
    startFetch(async () => {
      const result = await fetchOrderCandidates(fromDate, toDate);
      if ("error" in result) {
        setFetchError(result.error);
        return;
      }
      const sels = buildInitialSelections(result.candidates);
      setVariantSelections(sels);
      setCandidates(result.candidates);
      setSelectedIds(new Set());
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

  function setVariant(orderId: string, offerId: string, variantId: string) {
    setVariantSelections((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [offerId]: variantId },
    }));
  }

  function handleImport() {
    setImportError(null);
    setImportSuccess(null);
    startImport(async () => {
      // Build import payload for selected, ready orders
      const toImport: ImportOrder[] = candidates
        .filter((c) => selectedIds.has(c.yandexOrderId) && isOrderReady(c, variantSelections))
        .map((c) => ({
          yandexOrderId: c.yandexOrderId,
          orderDate: c.orderDate,
          mappedStatus: c.mappedStatus,
          sellPrice: c.sellPrice,
          buyerTotal: c.buyerTotal,
          subsidyTotal: c.subsidyTotal,
          buyerTotalBeforeDiscount: c.buyerTotalBeforeDiscount,
          deliveryCity: c.deliveryCity,
          shipmentDate: c.shipmentDate,
          fees: c.fees,
          feesSettled: c.feesSettled,
          // Only include items that have a product and variant selected
          items: c.items
            .filter(
              (item) =>
                item.product &&
                item.product.variants.length > 0 &&
                variantSelections[c.yandexOrderId]?.[item.offerId]
            )
            .map((item) => ({
              offerId: item.offerId,
              count: item.count,
              priceBeforeDiscount: item.priceBeforeDiscount,
              productId: item.product!.id,
              variantId: variantSelections[c.yandexOrderId][item.offerId],
            })),
        }));

      const result = await importYandexOrders(toImport, partnerId);
      if ("error" in result) {
        setImportError(result.error);
        return;
      }
      // Remove imported orders from the candidate list
      const importedSet = new Set(toImport.map((o) => o.yandexOrderId));
      setCandidates((prev) => prev.filter((c) => !importedSet.has(c.yandexOrderId)));
      setSelectedIds(new Set());
      setImportSuccess(`Импортировано ${result.imported} заказов`);
    });
  }

  // "Active" mapped statuses — orders that need stock reserved and are not yet completed
  // "Active" Yandex statuses — orders that need stock reserved and are not yet completed
  const ACTIVE_STATUSES = new Set(["PENDING", "UNPAID", "PROCESSING", "RESERVED", "DELIVERY", "PICKUP"]);
  const visibleCandidates =
    statusFilter === "all"
      ? candidates
      : statusFilter === "active"
      ? candidates.filter((c) => ACTIVE_STATUSES.has(c.yandexStatus))
      : candidates.filter((c) => c.yandexStatus === statusFilter);

  const readyCandidates = visibleCandidates.filter((c) => isOrderReady(c, variantSelections));
  const selectedReady = visibleCandidates.filter(
    (c) => selectedIds.has(c.yandexOrderId) && isOrderReady(c, variantSelections)
  );
  const selectedSellTotal = selectedReady.reduce((s, c) => s + c.sellPrice, 0);
  const selectedNetTotal = selectedReady.reduce(
    (s, c) => s + calcNet(c, commissionRate, avgDelivery).value,
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
            <optgroup label="По статусу Яндекс">
              <option value="PENDING">PENDING</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="RESERVED">RESERVED</option>
              <option value="DELIVERY">DELIVERY</option>
              <option value="PICKUP">PICKUP</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="CANCELLED_IN_DELIVERY">CANCELLED_IN_DELIVERY</option>
              <option value="RETURNED">RETURNED</option>
              <option value="RETURNED_PART">RETURNED_PART</option>
              <option value="LOST">LOST</option>
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
          {visibleCandidates.length === 0 ? (
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
                            : new Set(readyCandidates.map((c) => c.yandexOrderId))
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
                    {fmt(selectedSellTotal)} ₽ продажи,{" "}
                    ~{fmt(selectedNetTotal)} ₽ чистыми
                    {selectedSellTotal > 0 && (
                      <span className="ml-1.5 text-slate-400 font-normal">
                        ({(100 * (selectedSellTotal - selectedNetTotal) / selectedSellTotal).toFixed(1)}% издержки)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Order cards */}
              <div className="flex flex-col gap-3">
                {visibleCandidates.map((c) => {
                  const ready = isOrderReady(c, variantSelections);
                  const net = calcNet(c, commissionRate, avgDelivery);
                  const isSelected = selectedIds.has(c.yandexOrderId);
                  const hasUnmapped = c.items.some((i) => !i.product);

                  return (
                    <div
                      key={c.yandexOrderId}
                      className={`border rounded-md p-4 shadow-main transition-colors ${
                        isSelected ? "border-emerald-400 bg-emerald-50/30" : "bg-white"
                      } ${!ready ? "opacity-70" : ""}`}
                    >
                      {/* Order header row */}
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOrder(c.yandexOrderId)}
                          disabled={!ready}
                          className="w-4 h-4 accent-emerald-600"
                          title={!ready ? "Выберите вариант для всех товаров" : undefined}
                        />
                        <span className="font-mono text-sm font-medium">
                          #{c.yandexOrderId}
                        </span>
                        <span className="text-sm text-slate-500">
                          {c.orderDate.slice(0, 10)}
                        </span>
                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                          {c.yandexStatus}
                        </span>
                        <span className="ml-auto text-sm font-medium">
                          {fmt(c.sellPrice)} ₽
                        </span>
                        <span
                          className={`text-sm ${net.exact ? "text-emerald-700 font-medium" : "text-slate-500"}`}
                        >
                          {net.exact ? "" : "~"}{fmt(net.value)} ₽ чистыми
                          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded font-normal ${net.exact ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                            {net.exact ? "факт" : "оценка"}
                          </span>
                          {c.sellPrice > 0 && (
                            <span className="ml-1.5 text-xs text-slate-400">
                              ({(100 * (c.sellPrice - net.value) / c.sellPrice).toFixed(1)}% издержки)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Fee breakdown */}
                      <div className="mt-2 pl-7 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                        <span>Покупатель заплатил: {fmt(c.buyerTotal)} ₽</span>
                        {c.subsidyTotal > 0 && <span>Субсидия Яндекс: +{fmt(c.subsidyTotal)} ₽</span>}
                        <span>Выручка продавца: {fmt(c.sellPrice)} ₽</span>
                        <span>Комиссия ({commissionRate}%): −{fmt(Math.round((c.sellPrice * commissionRate) / 100))} ₽</span>
                        {c.feesSettled ? (
                          <>
                            {c.fees.feeRub !== 0 && <span>FEE (API): {fmt(c.fees.feeRub)} ₽</span>}
                            {c.fees.deliveryRub !== 0 && <span>Доставка: −{fmt(c.fees.deliveryRub)} ₽</span>}
                            {c.fees.expressDeliveryRub !== 0 && <span>Экспресс-доставка: −{fmt(c.fees.expressDeliveryRub)} ₽</span>}
                            {c.fees.crossDeliveryRub !== 0 && <span>Межрегиональная доставка: −{fmt(c.fees.crossDeliveryRub)} ₽</span>}
                            {c.fees.paymentTransferRub !== 0 && <span>Эквайринг: −{fmt(c.fees.paymentTransferRub)} ₽</span>}
                            {c.fees.agencyRub !== 0 && <span>Агентская: −{fmt(c.fees.agencyRub)} ₽</span>}
                            {c.fees.loyaltyFeeRub !== 0 && <span>Лояльность: −{fmt(c.fees.loyaltyFeeRub)} ₽</span>}
                            {c.fees.sortingRub !== 0 && <span>Сортировка: −{fmt(c.fees.sortingRub)} ₽</span>}
                          </>
                        ) : (
                          <span>Средняя доставка (оценка): −{fmt(avgDelivery)} ₽ × {c.items.reduce((s, i) => s + i.count, 0)} шт = −{fmt(avgDelivery * c.items.reduce((s, i) => s + i.count, 0))} ₽</span>
                        )}
                      </div>

                      {/* Items */}
                      <div className="mt-3 flex flex-col gap-2 pl-7">
                        {c.items.map((item) => {
                          const itemNet = calcItemNet(item, c, commissionRate, avgDelivery);
                          return (
                          <div key={item.offerId} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.offerId}
                            </span>
                            <span className="text-slate-500">
                              {item.count} × {fmt(itemNet)} ₽/шт = {fmt(item.count * itemNet)} ₽
                            </span>

                            {!item.product ? (
                              // SKU not found in our product catalog
                              <span className="text-amber-600 text-xs">
                                ⚠ Товар не найден — будет пропущен
                              </span>
                            ) : item.product.variants.length === 0 ? (
                              <span className="text-amber-600 text-xs">
                                ⚠ Нет вариантов — будет пропущен
                              </span>
                            ) : item.product.variants.length === 1 ? (
                              // Only one variant — auto-selected, just show the name
                              <span className="text-slate-400 text-xs">
                                {item.product.variants[0].variantName}
                              </span>
                            ) : (
                              // Multiple variants — user must choose
                              <select
                                value={variantSelections[c.yandexOrderId]?.[item.offerId] ?? ""}
                                onChange={(e) =>
                                  setVariant(c.yandexOrderId, item.offerId, e.target.value)
                                }
                                className="admin-form-input text-xs py-0.5 w-48"
                              >
                                {!variantSelections[c.yandexOrderId]?.[item.offerId] && (
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
                {importSuccess && (
                  <p className="text-emerald-600 text-sm font-medium">{importSuccess}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
