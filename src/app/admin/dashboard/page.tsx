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
        status: OrderStatusEnum.SHIPPED,
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
    saleM2: number;
    returnCount: number;
    returnM2: number;
    revenueRub: number;
    costRub: number;
    taxRub: number;
    commissionRub: number;
    marginRub: number;
  };

  const months: MonthRow[] = Array.from({ length: 12 }, () => ({
    saleCount: 0, saleM2: 0, returnCount: 0, returnM2: 0,
    revenueRub: 0, costRub: 0, taxRub: 0, commissionRub: 0, marginRub: 0,
  }));

  for (const order of orders) {
    const month = new Date(order.orderDate).getMonth(); // 0-based
    const row = months[month];
    const orderM2 = order.items.reduce((s, i) => s + (i.quantityM2 ?? 0), 0);
    if (order.orderType === OrderTypeEnum.SALE) {
      row.saleCount++;
      row.saleM2 += orderM2;
    } else {
      row.returnCount++;
      row.returnM2 += orderM2;
    }

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
    saleM2: acc.saleM2 + m.saleM2,
    returnCount: acc.returnCount + m.returnCount,
    returnM2: acc.returnM2 + m.returnM2,
    revenueRub: acc.revenueRub + m.revenueRub,
    costRub: acc.costRub + m.costRub,
    taxRub: acc.taxRub + m.taxRub,
    commissionRub: acc.commissionRub + m.commissionRub,
    marginRub: acc.marginRub + m.marginRub,
  }), { saleCount: 0, saleM2: 0, returnCount: 0, returnM2: 0, revenueRub: 0, costRub: 0, taxRub: 0, commissionRub: 0, marginRub: 0 });

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

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {months.map((row, i) => {
              if (row.saleCount === 0 && row.returnCount === 0) return null;
              const marginColor = row.marginRub >= 0 ? "text-emerald-600" : "text-red-500";
              return (
                <div key={i} className="border border-slate-200 rounded-lg p-4 text-sm">
                  <div className="font-semibold text-slate-700 mb-3">{MONTH_NAMES[i]}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                    <span className="text-slate-400">Продажи</span>
                    <span>{row.saleCount} зак. · {row.saleM2.toFixed(2)} м²</span>
                    {row.returnCount > 0 && <>
                      <span className="text-slate-400">Возвраты</span>
                      <span>{row.returnCount} зак. · {row.returnM2.toFixed(2)} м²</span>
                    </>}
                    <span className="text-slate-400">Выручка</span>
                    <span>{fmt(row.revenueRub)} ₽</span>
                    {row.costRub > 0 && <>
                      <span className="text-slate-400">Себест.</span>
                      <span>{fmt(row.costRub)} ₽</span>
                    </>}
                    {taxRate && row.taxRub > 0 && <>
                      <span className="text-slate-400">Налог</span>
                      <span>{fmt(row.taxRub)} ₽</span>
                    </>}
                    {commissionRate && row.commissionRub > 0 && <>
                      <span className="text-slate-400">Комиссия</span>
                      <span>{fmt(row.commissionRub)} ₽</span>
                    </>}
                    {row.costRub > 0 && <>
                      <span className="text-slate-400">Маржа</span>
                      <span className={`font-medium ${marginColor}`}>
                        {(row.marginRub >= 0 ? "+" : "") + fmt(row.marginRub)} ₽
                        <span className="font-normal ml-1">({pct(row.marginRub, row.revenueRub)})</span>
                      </span>
                    </>}
                  </div>
                </div>
              );
            })}
            {/* Mobile total */}
            <div className="border-t-2 border-slate-300 pt-3 text-sm font-semibold">
              <div className="text-slate-700 mb-2">Итого</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-normal text-slate-600">
                <span className="text-slate-400">Продажи</span>
                <span>{total.saleCount} зак. · {total.saleM2.toFixed(2)} м²</span>
                {total.returnCount > 0 && <>
                  <span className="text-slate-400">Возвраты</span>
                  <span>{total.returnCount} зак. · {total.returnM2.toFixed(2)} м²</span>
                </>}
                <span className="text-slate-400">Выручка</span>
                <span className="font-semibold">{fmt(total.revenueRub)} ₽</span>
                {total.costRub > 0 && <>
                  <span className="text-slate-400">Себест.</span>
                  <span>{fmt(total.costRub)} ₽</span>
                </>}
                {taxRate && total.taxRub > 0 && <>
                  <span className="text-slate-400">Налог</span>
                  <span>{fmt(total.taxRub)} ₽</span>
                </>}
                {commissionRate && total.commissionRub > 0 && <>
                  <span className="text-slate-400">Комиссия</span>
                  <span>{fmt(total.commissionRub)} ₽</span>
                </>}
                {total.costRub > 0 && <>
                  <span className="text-slate-400">Маржа</span>
                  <span className={`font-semibold ${total.marginRub >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {(total.marginRub >= 0 ? "+" : "") + fmt(total.marginRub)} ₽
                    <span className="font-normal ml-1">({pct(total.marginRub, total.revenueRub)})</span>
                  </span>
                </>}
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
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
                      <td className="text-right px-3">
                        {hasData ? <>{row.saleCount}<div className="text-xs text-slate-400">{row.saleM2.toFixed(2)} м²</div></> : "—"}
                      </td>
                      <td className="text-right px-3">
                        {hasData ? <>{row.returnCount}{row.returnCount > 0 && <div className="text-xs text-slate-400">{row.returnM2.toFixed(2)} м²</div>}</> : "—"}
                      </td>
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
                  <td className="text-right px-3">
                    {total.saleCount}<div className="text-xs text-slate-400 font-normal">{total.saleM2.toFixed(2)} м²</div>
                  </td>
                  <td className="text-right px-3">
                    {total.returnCount}{total.returnCount > 0 && <div className="text-xs text-slate-400 font-normal">{total.returnM2.toFixed(2)} м²</div>}
                  </td>
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
          </div> {/* end desktop table */}
        </div>
      </div>
    </>
  );
}
