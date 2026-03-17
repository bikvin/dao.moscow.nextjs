import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import WarehouseTable from "@/components/admin/warehouse/WarehouseTable";
import { db } from "@/db";
import Link from "next/link";
import { OzonSyncStatusEnum, YandexSyncStatusEnum } from "@prisma/client";

export default async function ProfilePage() {
  const [lastYandexLog, lastOzonLog] = await Promise.all([
    db.yandexSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.ozonSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] mx-auto">
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
