"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import FormButton from "@/components/common/formButton/formButton";
import { recalculateOzonOrders, type RecalculateState } from "@/actions/ozon/recalculateOzonOrders";

// Formats kopeck amount to rubles with 2 decimal places.
function rub(kopecks: number) {
  return (kopecks / 100).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₽";
}

// Button that triggers recalculation of Ozon order net prices for all unsettled orders.
// After settling, shows a before/after comparison table for each updated order.
export function RecalculateOzonCommissionsButton() {
  const [formState, action] = useFormState<RecalculateState, FormData>(recalculateOzonOrders, {});

  return (
    <div>
      <form action={action} className="inline-block">
        <FormButton color="green" small>
          Пересчитать комиссии
        </FormButton>
      </form>

      {formState.errors?._form && (
        <div className="text-red-600 text-sm mt-2">
          {formState.errors._form.join(", ")}
        </div>
      )}

      {formState.success && (
        <div className="mt-2">
          <p className={`text-sm font-medium ${formState.success.changes ? "text-slate-700" : "text-emerald-600"}`}>
            {formState.success.message}
          </p>

          {formState.success.changes && formState.success.changes.length > 0 && (
            <div className="mt-2 overflow-x-auto">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pr-4 pb-1 font-medium">Заказ</th>
                    <th className="pr-4 pb-1 font-medium text-right">Оценка</th>
                    <th className="pr-4 pb-1 font-medium text-right">Факт</th>
                    <th className="pb-1 font-medium text-right">Разница</th>
                  </tr>
                </thead>
                <tbody>
                  {formState.success.changes.map((c) => {
                    const isPending = c.realTotalRub === null;
                    const diff = isPending ? null : c.realTotalRub! - c.estimatedTotalRub;
                    return (
                      <tr key={c.orderId} className="border-b border-slate-100">
                        <td className="pr-4 py-1">
                          <Link
                            href={`/admin?scrollToOrder=${c.orderId}&status=ALL`}
                            className="text-sky-600 hover:underline"
                          >
                            №{c.sequenceNumber}/{c.year}
                          </Link>
                        </td>
                        <td className="pr-4 py-1 text-right text-slate-500">
                          {rub(c.estimatedTotalRub)}
                        </td>
                        <td className="pr-4 py-1 text-right text-slate-800 font-medium">
                          {isPending ? (
                            <span className="text-slate-400 font-normal">ожидание</span>
                          ) : c.isEstimated ? (
                            <span title="Рассчитано по средней комиссии, данные Ozon недоступны">
                              ~{rub(c.realTotalRub!)}
                            </span>
                          ) : rub(c.realTotalRub!)}
                        </td>
                        <td className={`py-1 text-right font-medium ${diff === null ? "text-slate-300" : diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {diff === null ? "—" : c.isEstimated ? `~${diff >= 0 ? "+" : ""}${rub(diff)}` : `${diff >= 0 ? "+" : ""}${rub(diff)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
