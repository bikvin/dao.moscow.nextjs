"use client";

import { useState, useTransition } from "react";
import { backfillIssueCostPrices } from "@/actions/product/receipt-prices/backfillIssueCostPrices";

// One-time backfill button: calculates FIFO costPrice for all SALE issues that still have none.
export function BackfillIssueCostPricesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ updatedIssues: number } | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      const res = await backfillIssueCostPrices();
      setResult(res);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="self-start px-4 py-2 text-sm font-medium rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isPending ? "Обновление..." : "Рассчитать себестоимость списаний"}
      </button>
      {result && (
        <p className="text-sm text-emerald-700 font-medium">
          Обновлено списаний: {result.updatedIssues}
        </p>
      )}
    </div>
  );
}
