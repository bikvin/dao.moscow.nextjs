import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import WarehouseTable from "@/components/admin/warehouse/WarehouseTable";
import { db } from "@/db";
import Link from "next/link";
import { YandexSyncStatusEnum } from "@prisma/client";

export default async function ProfilePage() {
  const lastLog = await db.yandexSyncLog.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] mx-auto">
          {/* Yandex last sync banner */}
          <div className="mt-4 mb-2 text-sm flex items-center gap-3 text-slate-500">
            <span>Яндекс Маркет:</span>
            {lastLog ? (
              <>
                <span>
                  {new Date(lastLog.createdAt).toLocaleString("ru-RU")}
                </span>
                <span
                  className={
                    lastLog.status === YandexSyncStatusEnum.SUCCESS
                      ? "text-emerald-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {lastLog.status === YandexSyncStatusEnum.SUCCESS
                    ? "Успешно"
                    : `Ошибка: ${lastLog.message}`}
                </span>
              </>
            ) : (
              <span className="text-slate-400">нет данных</span>
            )}
            <Link href="/admin/yandex" className="text-sky-600 hover:underline">
              Синхронизировать
            </Link>
          </div>

          <WarehouseTable />
        </div>
      </div>
    </>
  );
}
