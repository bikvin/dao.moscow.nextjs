export const dynamic = "force-dynamic";

import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { CurrencyEnum } from "@prisma/client";
import { CreateCashTransactionForm, CashBalances, CashTransactionRow, CashTableHeader, ScrollButtons } from "@/components/admin/cash/CashForm";
import { CashFilters } from "@/components/admin/cash/CashFilters";

// Admin page showing cash balances per currency and a full transaction log.
export default async function CashPage({
  searchParams,
}: {
  searchParams: { currency?: string; year?: string };
}) {
  await requireAdmin();

  const currentYear = new Date().getFullYear();
  const selectedYear = parseInt(searchParams.year ?? String(currentYear), 10) || currentYear;
  const selectedCurrency: CurrencyEnum = (searchParams.currency as CurrencyEnum | undefined) ?? CurrencyEnum.RUB;

  const [allTransactions, availableYearRows] = await Promise.all([
    db.cashTransaction.findMany({
      where: {
        date: {
          gte: new Date(`${selectedYear}-01-01`),
          lt: new Date(`${selectedYear + 1}-01-01`),
        },
        currency: selectedCurrency,
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    db.cashTransaction.findMany({ select: { date: true } }),
  ]);

  // Compute per-currency balances across ALL time (not filtered by year/currency).
  const allTime = await db.cashTransaction.findMany({ select: { currency: true, type: true, amount: true } });
  const balanceMap = new Map<CurrencyEnum, number>();
  for (const tx of allTime) {
    const cur = balanceMap.get(tx.currency) ?? 0;
    balanceMap.set(tx.currency, cur + (tx.type === "IN" ? tx.amount : -tx.amount));
  }
  const balances = Object.values(CurrencyEnum).map((c) => ({
    currency: c,
    balance: balanceMap.get(c) ?? 0,
  }));

  const availableYears = [...new Set(availableYearRows.map((r) => new Date(r.date).getFullYear()))]
    .sort((a, b) => b - a);
  const yearRange = availableYears.length > 0 ? availableYears : [currentYear];

  return (
    <>
      {/* Sticky header block: top menu + balances + form + table column headers */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <TopMenu />
        <div className="max-w-screen-lg mx-auto">
          <div className="w-[95%] mx-auto py-3 border-b border-slate-100">
            <h1 className="admin-form-header">Деньги на складе</h1>

            {/* Balance cards — click to switch currency */}
            <CashBalances balances={balances} selectedCurrency={selectedCurrency} selectedYear={selectedYear} />

            {/* Year filter + add form */}
            <div className="mt-4 flex flex-wrap gap-4 items-start">
              <CashFilters
                selectedCurrency={selectedCurrency}
                selectedYear={selectedYear}
                yearRange={yearRange}
              />
              <CreateCashTransactionForm key={selectedCurrency} defaultCurrency={selectedCurrency} />
            </div>

            {/* Table column headers */}
            <div className="mt-4">
              <CashTableHeader currency={selectedCurrency} />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[95%] mx-auto pb-16">
          {allTransactions.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">Операций в {selectedCurrency} за {selectedYear} не найдено</p>
          ) : (
            <div className="border-x border-b border-slate-100 rounded-b-md overflow-hidden">
              {allTransactions.map((tx) => (
                <CashTransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
      <ScrollButtons />
    </>
  );
}
