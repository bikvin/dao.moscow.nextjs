import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { Pagination } from "@/components/admin/Pagination";
import { YandexSyncStatusEnum } from "@prisma/client";

const PAGE_SIZE = 50;

export default async function YandexPriceSyncHistoryPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [logs, total] = await Promise.all([
    db.yandexPriceSyncLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.yandexPriceSyncLog.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">История синхронизаций цен</h1>

          <div className="mt-8">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-sm">Синхронизаций ещё не было</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border rounded-md mb-1 p-3 shadow-main">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      {new Date(log.createdAt).toLocaleString("ru-RU")} UTC
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        log.status === YandexSyncStatusEnum.SUCCESS
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {log.status === YandexSyncStatusEnum.SUCCESS ? "Успешно" : "Ошибка"}
                    </span>
                    <span className="text-sm text-slate-400">
                      {log.trigger === "MANUAL" ? "вручную" : "авто"}
                    </span>
                    {log.skuCount != null && (
                      <span className="text-sm text-slate-400">{log.skuCount} SKU</span>
                    )}
                  </div>
                  {log.message && (
                    <div className="text-sm text-slate-500 mt-0.5">{log.message}</div>
                  )}
                </div>
              ))
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/yandex/price-sync-history"
            searchParams={searchParams}
          />
        </div>
      </div>
    </>
  );
}
