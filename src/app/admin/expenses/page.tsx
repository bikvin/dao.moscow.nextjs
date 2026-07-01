export const dynamic = "force-dynamic";

import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { CreateExpenseForm, ExpenseRow, GenerateFromRecurring } from "@/components/admin/expense/ExpenseForm";
import Link from "next/link";
import { CurrencyEnum } from "@prisma/client";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

// Admin page for managing single expense entries, grouped by month.
export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  await requireAdmin();

  const currentYear = new Date().getFullYear();
  const selectedYear = parseInt(searchParams.year ?? String(currentYear), 10) || currentYear;

  const [expenses, availableYearRows, recurring, usdRateSetting, rmbRateSetting] = await Promise.all([
    db.expense.findMany({
      where: {
        date: {
          gte: new Date(`${selectedYear}-01-01`),
          lt: new Date(`${selectedYear + 1}-01-01`),
        },
      },
      orderBy: { date: "asc" },
    }),
    db.expense.findMany({ select: { date: true } }),
    db.recurringExpense.findMany({ orderBy: { name: "asc" } }),
    db.settings.findUnique({ where: { field: "usdMainRate" } }),
    db.settings.findUnique({ where: { field: "rmbOfficialRate" } }),
  ]);

  const usdRate = usdRateSetting ? parseFloat(usdRateSetting.value) : null;
  const rmbRate = rmbRateSetting ? parseFloat(rmbRateSetting.value) : null;

  const availableYears = [...new Set(availableYearRows.map((r) => new Date(r.date).getFullYear()))]
    .sort((a, b) => b - a);
  const yearRange = availableYears.length > 0 ? availableYears : [currentYear];

  // Converts an expense amount (in kopecks) to RUB using current exchange rates.
  function toRub(amount: number, currency: CurrencyEnum): number | null {
    if (currency === CurrencyEnum.RUB) return amount / 100;
    if (currency === CurrencyEnum.USD) return usdRate != null ? (amount / 100) * usdRate : null;
    if (currency === CurrencyEnum.RMB) return rmbRate != null ? (amount / 100) * rmbRate : null;
    return null;
  }

  // Group expenses by year-month
  const groups: { key: string; label: string; expenses: typeof expenses }[] = [];
  for (const expense of expenses) {
    const d = new Date(expense.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const existing = groups.find((g) => g.key === key);
    if (existing) existing.expenses.push(expense);
    else groups.push({ key, label, expenses: [expense] });
  }
  groups.sort((a, b) => a.key.localeCompare(b.key));

  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const defaultDateForYear = selectedYear === now.getFullYear()
    ? defaultDate
    : `${selectedYear}-12-31`;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto">
        <div className="w-[95%] mx-auto pb-16">
          <div className="flex items-baseline gap-4 mt-10 mb-6">
            <h1 className="admin-form-header !mt-0">Расходы</h1>
            <div className="flex gap-2">
              {yearRange.map((y) => (
                <Link
                  key={y}
                  href={`/admin/expenses?year=${y}`}
                  className={`text-sm px-3 py-1 rounded-md border ${
                    y === selectedYear
                      ? "bg-slate-800 text-white border-slate-800"
                      : "border-slate-300 text-slate-600 hover:border-slate-500"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>
            <Link href="/admin/expenses/recurring" className="text-sm text-blue-500 hover:underline">
              Шаблоны →
            </Link>
          </div>

          <div className="max-w-3xl">
            {groups.length === 0 ? (
              <p className="text-sm text-slate-400 mb-6">Расходы не добавлены</p>
            ) : (
              <div className="mb-8">
                {groups.map(({ key, label, expenses: groupExpenses }) => {
                  let totalRub = 0;
                  let partial = false;
                  for (const e of groupExpenses) {
                    const rub = toRub(e.amount, e.currency);
                    if (rub == null) { partial = true; }
                    else { totalRub += rub; }
                  }
                  return (
                    <div key={key} className="border rounded-md shadow-main overflow-hidden mb-3">
                      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                        <span className="text-sm font-semibold text-slate-700 capitalize">{label}</span>
                      </div>
                      <div className="px-4 py-1">
                        {groupExpenses.map((e: (typeof expenses)[0]) => (
                          <ExpenseRow key={e.id} expense={e} usdRate={usdRate} rmbRate={rmbRate} />
                        ))}
                      </div>
                      <div className="flex items-baseline justify-between px-4 py-2 border-t border-slate-100 bg-slate-50">
                        <span className="text-sm font-semibold text-slate-600">Итого</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {partial ? "≈" : ""}{Math.round(totalRub).toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <CreateExpenseForm defaultDate={defaultDateForYear} />
            <div className="mt-4">
              <GenerateFromRecurring recurring={recurring} defaultDate={defaultDateForYear} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
