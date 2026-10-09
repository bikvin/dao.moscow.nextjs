import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import WarehouseTable from "@/components/admin/warehouse/WarehouseTable";
import { OzonRecalcBanner } from "@/components/admin/warehouse/OzonRecalcBanner";
import { db } from "@/db";
import Link from "next/link";
import { OzonSyncStatusEnum, YandexSyncStatusEnum } from "@prisma/client";

export default async function WarehousePage() {
  const [lastYandexLog, lastOzonLog, ozonKeyRenewDateSetting, ozonKeyPeriodDaysSetting, ozonRecalcResultSetting] = await Promise.all([
    db.yandexSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.ozonSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.settings.findUnique({ where: { field: "ozonKeyRenewDate" } }),
    db.settings.findUnique({ where: { field: "ozonKeyPeriodDays" } }),
    db.settings.findUnique({ where: { field: "lastOzonCommissionRecalcResult" } }),
  ]);

  const ozonRecalcResult = ozonRecalcResultSetting
    ? (() => { try { return JSON.parse(ozonRecalcResultSetting.value); } catch { return null; } })()
    : null;

  const ozonKeyRenewDate = ozonKeyRenewDateSetting?.value ?? null;
  const ozonKeyPeriodDays = parseInt(ozonKeyPeriodDaysSetting?.value ?? "90", 10);
  let ozonKeyDaysLeft: number | null = null;
  if (ozonKeyRenewDate) {
    const expiresAt = new Date(ozonKeyRenewDate);
    expiresAt.setDate(expiresAt.getDate() + ozonKeyPeriodDays);
    ozonKeyDaysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] mx-auto">
          {/* Ozon API key expiry warning */}
          {ozonKeyDaysLeft !== null && ozonKeyDaysLeft <= 14 && (
            <div className={`mt-4 rounded-md px-4 py-3 text-sm ${ozonKeyDaysLeft <= 0 ? "bg-red-50 border border-red-200 text-red-700" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
              <p className="font-medium">
                {ozonKeyDaysLeft <= 0
                  ? `Ключ Ozon API истёк ${Math.abs(ozonKeyDaysLeft)} дн. назад`
                  : `Ключ Ozon API истекает через ${ozonKeyDaysLeft} дн.`}
              </p>
              <p className="mt-1 text-xs opacity-80">
                Получите новый ключ в&nbsp;кабинете Ozon → Настройки → API&nbsp;ключи, затем выполните на сервере:
              </p>
              <code className="mt-1 block text-xs bg-white/60 rounded px-2 py-1 font-mono">
                ssh bikvin@31.130.144.112 <br />
                ~/update-ozon-key.sh &lt;новый-ключ&gt;
              </code>
              <p className="mt-1 text-xs opacity-80">
                После обновления не забудьте обновить дату ключа на&nbsp;
                <Link href="/admin/ozon" className="underline">странице Ozon</Link>.
              </p>
            </div>
          )}

          {/* Ozon commission recalculation result banner */}
          {ozonRecalcResult && (
            <OzonRecalcBanner
              updated={ozonRecalcResult.updated}
              changes={ozonRecalcResult.changes}
              at={ozonRecalcResult.at}
            />
          )}

          {/* Marketplace sync banners — only shown on error */}
          <div className="mt-4 mb-2 flex flex-col gap-1">
            {lastYandexLog && lastYandexLog.status !== YandexSyncStatusEnum.SUCCESS && (
              <div className="text-sm flex items-center gap-3 text-slate-500">
                <span>Яндекс Маркет:</span>
                <span>{new Date(lastYandexLog.createdAt).toLocaleString("ru-RU")} UTC</span>
                <span className="text-red-600 font-medium">Ошибка: {lastYandexLog.message}</span>
                <Link href="/admin/yandex" className="text-sky-600 hover:underline">
                  Синхронизировать
                </Link>
              </div>
            )}
            {lastOzonLog && lastOzonLog.status !== OzonSyncStatusEnum.SUCCESS && (
              <div className="text-sm flex items-center gap-3 text-slate-500">
                <span>Ozon:</span>
                <span>{new Date(lastOzonLog.createdAt).toLocaleString("ru-RU")} UTC</span>
                <span className="text-red-600 font-medium">Ошибка: {lastOzonLog.message}</span>
                <Link href="/admin/ozon" className="text-sky-600 hover:underline">
                  Синхронизировать
                </Link>
              </div>
            )}
          </div>

          <WarehouseTable />
        </div>
      </div>
    </>
  );
}
