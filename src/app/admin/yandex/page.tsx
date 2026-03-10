import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { YandexSyncButton } from "@/components/admin/yandex/YandexSyncButton";
import { DefaultBufferForm } from "@/components/admin/yandex/DefaultBufferForm";
import Link from "next/link";
import { YandexSyncStatusEnum } from "@prisma/client";

export default async function YandexPage() {
  const [lastLog, bufferSetting] = await Promise.all([
    db.yandexSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.settings.findUnique({ where: { field: "yandexDefaultBuffer" } }),
  ]);

  const globalBuffer = bufferSetting ? parseInt(bufferSetting.value, 10) || 0 : 0;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Яндекс Маркет</h1>

          {/* Last sync status */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-2">Последняя синхронизация</h2>
            {lastLog ? (
              <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-slate-500">
                  {new Date(lastLog.createdAt).toLocaleString("ru-RU")}
                </span>
                <span
                  className={
                    lastLog.status === YandexSyncStatusEnum.SUCCESS
                      ? "text-emerald-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {lastLog.status === YandexSyncStatusEnum.SUCCESS ? "Успешно" : "Ошибка"}
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

          {/* Sync button */}
          <div className="mt-6">
            <YandexSyncButton />
          </div>

          {/* Global buffer */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-3">Настройки</h2>
            <p className="text-sm text-slate-500 mb-3">
              Буфер вычитается из доступного количества перед делением на 3. Можно переопределить для каждого товара отдельно.
            </p>
            <DefaultBufferForm current={globalBuffer} />
          </div>

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            <Link className="link-button link-button-green" href="/admin/yandex/mappings">
              Маппинг товаров
            </Link>
            <Link className="link-button" href="/admin/yandex/sync-history">
              История синхронизаций
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
