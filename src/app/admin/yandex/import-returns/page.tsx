import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ImportYandexReturnsClient } from "@/components/admin/yandex/ImportYandexReturnsClient";
import Link from "next/link";

// Page for importing Yandex Market returns. Loads the Yandex partner and commission
// rate from settings, then delegates to the client component for the interactive UI.
export default async function ImportReturnsPage() {
  const [partnerIdSetting, commissionRateSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "yandexPartnerId" } }),
    db.settings.findUnique({ where: { field: "yandexCommissionRate" } }),
  ]);

  const partnerId = partnerIdSetting?.value ?? null;
  const commissionRate = commissionRateSetting ? parseInt(commissionRateSetting.value, 10) : 0;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-[95%] mx-auto">
          <h1 className="admin-form-header mt-10">Импорт возвратов Яндекс Маркет</h1>
          {!partnerId ? (
            <div className="border rounded-md p-4 mt-8 shadow-main text-sm text-amber-700 bg-amber-50">
              Партнёр не настроен. Укажите партнёра на{" "}
              <Link href="/admin/yandex" className="underline">
                странице настроек Яндекс Маркет
              </Link>
              .
            </div>
          ) : (
            <ImportYandexReturnsClient
              partnerId={partnerId}
              commissionRate={commissionRate}
            />
          )}
        </div>
      </div>
    </>
  );
}
