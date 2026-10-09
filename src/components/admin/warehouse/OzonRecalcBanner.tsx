"use client";

import { useState } from "react";
import Link from "next/link";
import { dismissOzonRecalcBanner } from "@/actions/ozon/dismissOzonRecalcBanner";
import type { CommissionChange } from "@/lib/ozon/recalculateOzonCommissions";

// Formats kopeck amount to rubles.
function rub(kopecks: number) {
  return (kopecks / 100).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₽";
}

interface Props {
  updated: number;
  changes: CommissionChange[];
  at: string;
}

// Banner shown on the warehouse page when the cron recalculated Ozon commissions.
// Displays a before/after table for each updated order; dismissed by clicking ×,
// which deletes the record from the settings table so it won't appear again.
export function OzonRecalcBanner({ updated, changes, at }: Props) {
  const [visible, setVisible] = useState(true);

  // Only show orders that were actually updated (realTotalRub != null)
  const settled = changes.filter((c) => c.realTotalRub !== null);

  if (!visible) return null;

  async function handleDismiss() {
    setVisible(false);
    await dismissOzonRecalcBanner();
  }

  return (
    <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">
            Пересчитаны комиссии Ozon: обновлено {updated} {updated === 1 ? "заказ" : updated < 5 ? "заказа" : "заказов"}
            <span className="ml-2 text-xs font-normal text-sky-600">
              {new Date(at).toLocaleString("ru-RU")} UTC
            </span>
          </p>

          {settled.length > 0 && (
            <table className="mt-2 border-collapse text-xs w-full max-w-sm">
              <thead>
                <tr className="text-left text-sky-600 border-b border-sky-200">
                  <th className="pr-4 pb-1 font-medium">Заказ</th>
                  <th className="pr-4 pb-1 font-medium text-right">Было</th>
                  <th className="pr-4 pb-1 font-medium text-right">Стало</th>
                  <th className="pb-1 font-medium text-right">Разница</th>
                </tr>
              </thead>
              <tbody>
                {settled.map((c) => {
                  const diff = c.realTotalRub! - c.estimatedTotalRub;
                  return (
                    <tr key={c.orderId} className="border-b border-sky-100">
                      <td className="pr-4 py-0.5">
                        <Link
                          href={`/admin?scrollToOrder=${c.orderId}&status=ALL`}
                          className="text-sky-700 hover:underline"
                        >
                          №{c.sequenceNumber}/{c.year}
                        </Link>
                      </td>
                      <td className="pr-4 py-0.5 text-right text-sky-600">{rub(c.estimatedTotalRub)}</td>
                      <td className="pr-4 py-0.5 text-right font-medium">
                        {c.isEstimated ? (
                          <span title="Рассчитано по средней комиссии">~{rub(c.realTotalRub!)}</span>
                        ) : rub(c.realTotalRub!)}
                      </td>
                      <td className={`py-0.5 text-right font-medium ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {c.isEstimated ? "~" : ""}{diff >= 0 ? "+" : ""}{rub(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="text-sky-500 hover:text-sky-800 text-base leading-none mt-0.5 flex-shrink-0"
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
    </div>
  );
}
