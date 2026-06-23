"use client";

import { useState, useTransition } from "react";
import { backfillReceiptQuantityLeft } from "@/actions/product/receipt-prices/backfillReceiptQuantityLeft";

// One-time backfill button: sets quantityLeft = quantity for all receipts that still have quantityLeft = 0.
export function BackfillQuantityLeftButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ updated: number } | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      const res = await backfillReceiptQuantityLeft();
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
        {isPending ? "Обновление..." : "Заполнить остатки по приходам"}
      </button>
      {result && (
        <p className="text-sm text-emerald-700 font-medium">
          Обновлено записей: {result.updated}
        </p>
      )}
    </div>
  );
}
