export const dynamic = "force-dynamic";

import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { OrderStatusEnum, OrderTypeEnum } from "@prisma/client";
import { computeOrderProfit } from "@/lib/order/computeOrderProfit";
import Link from "next/link";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function fmt(n: number) {
  return Math.round(n).toLocaleString("ru-RU");
}

function pct(profit: number, revenue: number) {
  if (revenue === 0) return "—";
  return (profit / revenue * 100).toFixed(1) + "%";
}

// Admin-only monthly profit dashboard. Shows revenue, COGS, tax, commission and margin per month.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  await requireAdmin();

  const currentYear = new Date().getFullYear();
  const selectedYear = parseInt(searchParams.year ?? String(currentYear), 10) || currentYear;

  const [
    orders,
    availableYearRows,
    usdRateSetting,
    rmbRateSetting,
    taxRateSetting,
    taxableIdsSetting,
    commissionRateSetting,
    commissionIdsSetting,
  ] = await Promise.all([
    db.order.findMany({
      where: {
        orderDate: {
          gte: new Date(`${selectedYear}-01-01`),
          lt: new Date(`${selectedYear + 1}-01-01`),
        },
        orderType: { in: [OrderTypeEnum.SALE, OrderTypeEnum.RETURN] },
        status: { not: OrderStatusEnum.CANCELLED },
      },
      select: {
        orderType: true,
        totalRub: true,
        paymentMethodId: true,
        orderDate: true,
        items: { select: { productVariantId: true, quantityM2: true } },
        issues: {
          select: {
            productVariantId: true,
            quantity: true,
            costPrice: true,
            costPriceCurrency: true,
            costPriceUnit: true,
          },
        },
        receipts: {
          select: {
            productVariantId: true,
            quantity: true,
            price: true,
            priceCurrency: true,
            priceUnit: true,
          },
        },
      },
    }),
    db.order.findMany({
      where: { orderType: { in: [OrderTypeEnum.SALE, OrderTypeEnum.RETURN] }, status: { not: OrderStatusEnum.CANCELLED } },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
    db.settings.findUnique({ where: { field: "usdMainRate" } }),
    db.settings.findUnique({ where: { field: "rmbOfficialRate" } }),
    db.settings.findUnique({ where: { field: "taxRate" } }),
    db.settings.findUnique({ where: { field: "taxablePaymentMethodIds" } }),
    db.settings.findUnique({ where: { field: "commissionRate" } }),
    db.settings.findUnique({ where: { field: "commissionPaymentMethodIds" } }),
  ]);

  const availableYears = availableYearRows.map((r) => r.year);

  const usdRate = usdRateSetting ? parseFloat(usdRateSetting.value) : null;
  const rmbRate = rmbRateSetting ? parseFloat(rmbRateSetting.value) : null;
  const taxRate = taxRateSetting ? parseFloat(taxRateSetting.value) : null;
  const taxableIds: string[] = taxableIdsSetting ? JSON.parse(taxableIdsSetting.value) : [];
  const commissionRate = commissionRateSetting ? parseFloat(commissionRateSetting.value) : null;
  const commissionIds: string[] = commissionIdsSetting ? JSON.parse(commissionIdsSetting.value) : [];

  // Aggregate per month
  type MonthRow = {
    saleCount: number;
    returnCount: number;
    revenueRub: number;
    costRub: number;
    taxRub: number;
    commissionRub: number;
    marginRub: number;
  };

  const months: MonthRow[] = Array.from({ length: 12 }, () => ({
    saleCount: 0, returnCount: 0,
    revenueRub: 0, costRub: 0, taxRub: 0, commissionRub: 0, marginRub: 0,
  }));

  for (const order of orders) {
    const month = new Date(order.orderDate).getMonth(); // 0-based
    const row = months[month];
    if (order.orderType === OrderTypeEnum.SALE) row.saleCount++;
    else row.returnCount++;

    const sign = order.orderType === OrderTypeEnum.RETURN ? -1 : 1;
    row.revenueRub += sign * Math.abs(order.totalRub) / 100;

    const profit = computeOrderProfit(order, usdRate, rmbRate, taxRate, taxableIds, commissionRate, commissionIds);
    if (profit) {
      row.costRub += profit.costRub;
      row.taxRub += Math.abs(profit.taxRub);
      row.commissionRub += Math.abs(profit.commissionRub);
      row.marginRub += profit.profitRub;
    }
  }

  const total: MonthRow = months.reduce((acc, m) => ({
    saleCount: acc.saleCount + m.saleCount,
    returnCount: acc.returnCount + m.returnCount,
    revenueRub: acc.revenueRub + m.revenueRub,
    costRub: acc.costRub + m.costRub,
    taxRub: acc.taxRub + m.taxRub,
    commissionRub: acc.commissionRub + m.commissionRub,
    marginRub: acc.marginRub + m.marginRub,
  }), { saleCount: 0, returnCount: 0, revenueRub: 0, costRub: 0, taxRub: 0, commissionRub: 0, marginRub: 0 });

  const yearRange = availableYears.length > 0 ? availableYears : [currentYear];

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto">
        <div className="w-[95%] mx-auto pb-16">
          <div className="flex items-baseline gap-4 mt-10 mb-6">
            <h1 className="admin-form-header !mt-0">Дашборд</h1>
            <div className="flex gap-2">
              {yearRange.map((y) => (
                <Link
                  key={y}
                  href={`/admin/dashboard?year=${y}`}
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-500 text-xs">
                  <th className="text-left py-2 pr-4 font-medium">Месяц</th>
                  <th className="text-right py-2 px-3 font-medium">Продажи</th>
                  <th className="text-right py-2 px-3 font-medium">Возвраты</th>
                  <th className="text-right py-2 px-3 font-medium">Выручка</th>
                  <th className="text-right py-2 px-3 font-medium">Себест.</th>
                  {taxRate ? <th className="text-right py-2 px-3 font-medium">Налог</th> : null}
                  {commissionRate ? <th className="text-right py-2 px-3 font-medium">Комиссия</th> : null}
                  <th className="text-right py-2 px-3 font-medium">Маржа</th>
                  <th className="text-right py-2 px-3 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {months.map((row, i) => {
                  const hasData = row.saleCount > 0 || row.returnCount > 0;
                  const marginColor = row.marginRub >= 0 ? "text-emerald-600" : "text-red-500";
                  return (
                    <tr key={i} className={`border-b border-slate-100 ${hasData ? "" : "text-slate-300"}`}>
                      <td className="py-2 pr-4 font-medium">{MONTH_NAMES[i]}</td>
                      <td className="text-right px-3">{hasData ? row.saleCount : "—"}</td>
                      <td className="text-right px-3">{hasData ? row.returnCount : "—"}</td>
                      <td className="text-right px-3">{hasData ? fmt(row.revenueRub) + " ₽" : "—"}</td>
                      <td className="text-right px-3">{hasData && row.costRub > 0 ? fmt(row.costRub) + " ₽" : "—"}</td>
                      {taxRate ? <td className="text-right px-3">{hasData && row.taxRub > 0 ? fmt(row.taxRub) + " ₽" : "—"}</td> : null}
                      {commissionRate ? <td className="text-right px-3">{hasData && row.commissionRub > 0 ? fmt(row.commissionRub) + " ₽" : "—"}</td> : null}
                      <td className={`text-right px-3 font-medium ${hasData ? marginColor : ""}`}>
                        {hasData && row.costRub > 0 ? (row.marginRub >= 0 ? "+" : "") + fmt(row.marginRub) + " ₽" : "—"}
                      </td>
                      <td className={`text-right px-3 ${hasData ? marginColor : ""}`}>
                        {hasData && row.costRub > 0 ? pct(row.marginRub, row.revenueRub) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-semibold">
                  <td className="py-2 pr-4">Итого</td>
                  <td className="text-right px-3">{total.saleCount}</td>
                  <td className="text-right px-3">{total.returnCount}</td>
                  <td className="text-right px-3">{fmt(total.revenueRub)} ₽</td>
                  <td className="text-right px-3">{total.costRub > 0 ? fmt(total.costRub) + " ₽" : "—"}</td>
                  {taxRate ? <td className="text-right px-3">{total.taxRub > 0 ? fmt(total.taxRub) + " ₽" : "—"}</td> : null}
                  {commissionRate ? <td className="text-right px-3">{total.commissionRub > 0 ? fmt(total.commissionRub) + " ₽" : "—"}</td> : null}
                  <td className={`text-right px-3 ${total.marginRub >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {total.costRub > 0 ? (total.marginRub >= 0 ? "+" : "") + fmt(total.marginRub) + " ₽" : "—"}
                  </td>
                  <td className={`text-right px-3 ${total.marginRub >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {total.costRub > 0 ? pct(total.marginRub, total.revenueRub) : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
