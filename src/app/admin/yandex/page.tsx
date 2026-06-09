import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { YandexSyncButton } from "@/components/admin/yandex/YandexSyncButton";
import { YandexPriceSyncButton } from "@/components/admin/yandex/YandexPriceSyncButton";
import { YandexFetchOrdersButton } from "@/components/admin/yandex/YandexFetchOrdersButton";
import { DefaultBufferForm } from "@/components/admin/yandex/DefaultBufferForm";
import { DefaultDivisorForm } from "@/components/admin/yandex/DefaultDivisorForm";
import { DefaultPriceMarkupForm } from "@/components/admin/yandex/DefaultPriceMarkupForm";
import { CommissionRateForm } from "@/components/admin/yandex/CommissionRateForm";
import { AverageDeliveryForm } from "@/components/admin/yandex/AverageDeliveryForm";
import { EstimateDeliveryButton } from "@/components/admin/yandex/EstimateDeliveryButton";
import { YandexPartnerForm } from "@/components/admin/yandex/YandexPartnerForm";
import { YandexPaymentMethodForm } from "@/components/admin/yandex/YandexPaymentMethodForm";
import { RecalculateCommissionsButton } from "@/components/admin/yandex/RecalculateCommissionsButton";
import Link from "next/link";
import { YandexSyncStatusEnum } from "@prisma/client";

export default async function YandexPage() {
  const [lastLog, lastPriceLog, bufferSetting, divisorSetting, markupSetting, commissionRateSetting, avgDeliverySetting, partnerIdSetting, paymentMethodIdSetting, partners, paymentMethods] = await Promise.all([
    db.yandexSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.yandexPriceSyncLog.findFirst({ orderBy: { createdAt: "desc" } }),
    db.settings.findUnique({ where: { field: "yandexDefaultBuffer" } }),
    db.settings.findUnique({ where: { field: "yandexDefaultDivisor" } }),
    db.settings.findUnique({ where: { field: "yandexDefaultPriceMarkup" } }),
    db.settings.findUnique({ where: { field: "yandexCommissionRate" } }),
    db.settings.findUnique({ where: { field: "yandexAverageDeliveryRub" } }),
    db.settings.findUnique({ where: { field: "yandexPartnerId" } }),
    db.settings.findUnique({ where: { field: "yandexPaymentMethodId" } }),
    db.partner.findMany({
      include: { names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    db.paymentMethod.findMany({ orderBy: { name: "asc" } }),
  ]);

  const globalBuffer = bufferSetting ? parseInt(bufferSetting.value, 10) || 0 : 0;
  const globalDivisor = divisorSetting ? parseInt(divisorSetting.value, 10) : null;
  const globalPriceMarkup = markupSetting ? parseInt(markupSetting.value, 10) || 0 : 0;
  const commissionRate = commissionRateSetting ? parseInt(commissionRateSetting.value, 10) : null;
  const averageDelivery = avgDeliverySetting ? parseInt(avgDeliverySetting.value, 10) : null;
  const currentPartnerId = partnerIdSetting?.value ?? null;
  const currentPaymentMethodId = paymentMethodIdSetting?.value ?? null;
  const partnerOptions = partners.map((p) => ({
    id: p.id,
    name: p.names[0]?.name ?? p.id,
  }));

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
                  {new Date(lastLog.createdAt).toLocaleString("ru-RU")} UTC
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

          {/* Stock sync button */}
          <div className="mt-6">
            <YandexSyncButton />
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
                    lastPriceLog.status === YandexSyncStatusEnum.SUCCESS
                      ? "text-emerald-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {lastPriceLog.status === YandexSyncStatusEnum.SUCCESS ? "Успешно" : "Ошибка"}
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
            <YandexPriceSyncButton />
          </div>

          {/* Global settings */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-3">Настройки</h2>
            <p className="text-sm text-slate-500 mb-3">
              Количество: <code className="bg-slate-100 px-1 rounded">floor((количество − буфер) / делитель)</code>. Цена: розничная × (1 + наценка / 100). Комиссия используется для расчёта чистой выручки по заказам. Средняя доставка — стоимость за единицу товара (умножается на количество единиц в заказе). Можно переопределить для каждого товара отдельно.
            </p>
            <div className="flex flex-col gap-3">
              <DefaultBufferForm current={globalBuffer} />
              <DefaultDivisorForm current={globalDivisor} />
              <DefaultPriceMarkupForm current={globalPriceMarkup} />
              <CommissionRateForm current={commissionRate} />
              <AverageDeliveryForm current={averageDelivery} />
              <EstimateDeliveryButton />
              <YandexPartnerForm partners={partnerOptions} currentPartnerId={currentPartnerId} />
              <YandexPaymentMethodForm paymentMethods={paymentMethods} currentPaymentMethodId={currentPaymentMethodId} />
            </div>
          </div>

          {/* Commissions recalculation */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-2">Пересчёт комиссий</h2>
            <p className="text-sm text-slate-500 mb-3">
              Пересчитать чистую выручку по заказам, у которых комиссии ещё не подтверждены (feesSettled = false).
              Данные запрашиваются из API Яндекс Маркет; если комиссии появились — цены и итоги обновляются.
            </p>
            <RecalculateCommissionsButton />
          </div>

          {/* Orders debug */}
          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-2">Заказы</h2>
            <p className="text-sm text-slate-500 mb-3">Загрузить заказы за последние 30 дней (результат в консоли сервера).</p>
            <YandexFetchOrdersButton />
          </div>

          {/* Navigation */}
          <div className="flex gap-4 mt-8 flex-wrap">
            <Link className="link-button link-button-green" href="/admin/yandex/import-orders">
              Импорт заказов
            </Link>
            <Link className="link-button link-button-green" href="/admin/yandex/mappings">
              Маппинг товаров
            </Link>
            <Link className="link-button link-button-gray" href="/admin/yandex/sync-history">
              История синхронизаций остатков
            </Link>
            <Link className="link-button link-button-gray" href="/admin/yandex/price-sync-history">
              История синхронизаций цен
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
