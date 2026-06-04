"use client";

import { useState, useTransition } from "react";
import { estimateAvgDelivery } from "@/actions/yandex/estimateAvgDelivery";

// Fetches the last 90 days of Yandex orders and calculates the suggested average
// delivery cost per unit from settled orders. Displays the result so the user
// can manually enter it in the Average Delivery setting above.
export function EstimateDeliveryButton() {
  const [result, setResult] = useState<{
    avgPerUnit: number;
    orderCount: number;
    unitCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setResult(null);
    setError(null);
    startTransition(async () => {
      const res = await estimateAvgDelivery();
      if ("error" in res) {
        setError(res.error);
      } else {
        setResult(res);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="border-0 rounded-md text-white cursor-pointer bg-slate-500 hover:bg-slate-600 disabled:bg-slate-300 p-[5px] px-3 text-sm"
      >
        {isPending ? "Расчёт..." : "Рассчитать из данных Яндекс (90 дней)"}
      </button>
      {result && (
        <span className="text-sm text-slate-600">
          Рекомендуемое значение:{" "}
          <span className="font-medium text-slate-800">{result.avgPerUnit} ₽/шт</span>
          <span className="text-slate-400 ml-2">
            ({result.orderCount} заказов, {result.unitCount} единиц)
          </span>
        </span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
