import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ImportOrdersClient } from "@/components/admin/yandex/ImportOrdersClient";
import Link from "next/link";

export default async function ImportOrdersPage() {
  const [commissionRateSetting, avgDeliverySetting, partnerIdSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "yandexCommissionRate" } }),
    db.settings.findUnique({ where: { field: "yandexAverageDeliveryRub" } }),
    db.settings.findUnique({ where: { field: "yandexPartnerId" } }),
  ]);

  const commissionRate = commissionRateSetting ? parseInt(commissionRateSetting.value, 10) : 0;
  const avgDelivery = avgDeliverySetting ? parseInt(avgDeliverySetting.value, 10) : 0;
  const partnerId = partnerIdSetting?.value ?? null;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-[95%] mx-auto">
          <h1 className="admin-form-header mt-10">Импорт заказов Яндекс Маркет</h1>
          {!partnerId ? (
            <div className="border rounded-md p-4 mt-8 shadow-main text-sm text-amber-700 bg-amber-50">
              Партнёр не настроен. Укажите партнёра на{" "}
              <Link href="/admin/yandex" className="underline">
                странице настроек Яндекс Маркет
              </Link>
              .
            </div>
          ) : (
            <ImportOrdersClient
              partnerId={partnerId}
              commissionRate={commissionRate}
              avgDelivery={avgDelivery}
            />
          )}
        </div>
      </div>
    </>
  );
}
