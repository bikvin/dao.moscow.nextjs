import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { OzonSyncButton } from "@/components/admin/ozon/OzonSyncButton";
import { OzonPriceSyncButton } from "@/components/admin/ozon/OzonPriceSyncButton";
import { OzonDefaultBufferForm } from "@/components/admin/ozon/OzonDefaultBufferForm";
import { OzonDefaultDivisorForm } from "@/components/admin/ozon/OzonDefaultDivisorForm";
import { OzonWarehouseIdForm } from "@/components/admin/ozon/OzonWarehouseIdForm";
import { OzonDefaultPriceMarkupForm } from "@/components/admin/ozon/OzonDefaultPriceMarkupForm";
import Link from "next/link";
import { OzonSyncStatusEnum } from "@prisma/client";

export default async function OzonPage() {
  const [lastLog, lastPriceLog, bufferSetting, divisorSetting, warehouseSetting, markupSetting] = await Promise.all([
    db.ozonSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.ozonPriceSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.settings.findUnique({ where: { field: "ozonDefaultBuffer" } }),
    db.settings.findUnique({ where: { field: "ozonDefaultDivisor" } }),
    db.settings.findUnique({ where: { field: "ozonWarehouseId" } }),
    db.settings.findUnique({ where: { field: "ozonDefaultPriceMarkup" } }),
  ]);

  const globalBuffer = bufferSetting ? parseInt(bufferSetting.value, 10) || 0 : 0;
  const globalDivisor = divisorSetting ? parseInt(divisorSetting.value, 10) : null;
  const warehouseId = warehouseSetting?.value ?? null;
  const globalPriceMarkup = markupSetting ? parseInt(markupSetting.value, 10) || 0 : 0;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Ozon</h1>

          {/* Last sync status */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-2">Последняя синхронизация</h2>
            {lastLog ? (
              <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-slate-500">
                  {new Date(lastLog.createdAt).toLocaleString("ru-RU")} UTC
                </span>
                <span
                  className={
                    lastLog.status === OzonSyncStatusEnum.SUCCESS
                      ? "text-emerald-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {lastLog.status === OzonSyncStatusEnum.SUCCESS ? "Успешно" : "Ошибка"}
                </span>
                {lastLog.skuCount != null && (
                  <span className="text-slate-500">{lastLog.skuCount} SKU</span>
                )}
                {lastLog.message && (
                  <span className="text-slate-500">{lastLog.message}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Синхронизаций ещё не было</p>
            )}
          </div>

          {/* Stock sync button */}
          <div className="mt-6">
            <OzonSyncButton />
          </div>

          {/* Last price sync status */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-2">Последняя синхронизация цен</h2>
            {lastPriceLog ? (
              <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-slate-500">
                  {new Date(lastPriceLog.createdAt).toLocaleString("ru-RU")} UTC
                </span>
                <span
                  className={
                    lastPriceLog.status === OzonSyncStatusEnum.SUCCESS
                      ? "text-emerald-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {lastPriceLog.status === OzonSyncStatusEnum.SUCCESS ? "Успешно" : "Ошибка"}
                </span>
                {lastPriceLog.skuCount != null && (
                  <span className="text-slate-500">{lastPriceLog.skuCount} SKU</span>
                )}
                {lastPriceLog.message && (
                  <span className="text-slate-500">{lastPriceLog.message}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Синхронизаций ещё не было</p>
            )}
          </div>

          {/* Price sync button */}
          <div className="mt-6">
            <OzonPriceSyncButton />
          </div>

          {/* Global settings */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-3">Настройки</h2>
            <p className="text-sm text-slate-500 mb-3">
              Количество: <code className="bg-slate-100 px-1 rounded">floor((количество − буфер) / делитель)</code>. Цена: розничная × (1 + наценка / 100). Можно переопределить для каждого товара отдельно.
            </p>
            <div className="flex flex-col gap-3">
              <OzonWarehouseIdForm current={warehouseId} />
              <OzonDefaultBufferForm current={globalBuffer} />
              <OzonDefaultDivisorForm current={globalDivisor} />
              <OzonDefaultPriceMarkupForm current={globalPriceMarkup} />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 mt-8 flex-wrap">
            <Link className="link-button link-button-green" href="/admin/ozon/mappings">
              Маппинг товаров
            </Link>
            <Link className="link-button link-button-gray" href="/admin/ozon/sync-history">
              История синхронизаций остатков
            </Link>
            <Link className="link-button link-button-gray" href="/admin/ozon/price-sync-history">
              История синхронизаций цен
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
