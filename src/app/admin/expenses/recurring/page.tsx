export const dynamic = "force-dynamic";

import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { CreateRecurringExpenseForm, RecurringExpenseRow } from "@/components/admin/expense/RecurringExpenseForm";
import Link from "next/link";

// Admin page for managing recurring expense templates.
export default async function RecurringExpensesPage() {
  await requireAdmin();

  const recurring = await db.recurringExpense.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto">
        <div className="w-[95%] mx-auto pb-16">
          <div className="flex items-baseline gap-4 mt-10 mb-6">
            <h1 className="admin-form-header !mt-0">Шаблоны расходов</h1>
            <Link href="/admin/expenses" className="text-sm text-blue-500 hover:underline">
              ← К расходам
            </Link>
          </div>

          <div className="max-w-3xl mb-8">
            {recurring.length === 0 ? (
              <p className="text-sm text-slate-400 mb-6">Шаблоны не добавлены</p>
            ) : (
              <div className="mb-6">
                {recurring.map((r: (typeof recurring)[0]) => (
                  <RecurringExpenseRow key={r.id} expense={r} />
                ))}
              </div>
            )}
            <div className="mt-12">
              <CreateRecurringExpenseForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
