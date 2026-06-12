import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ImportOzonOrdersClient } from "@/components/admin/ozon/ImportOzonOrdersClient";
import Link from "next/link";

export default async function ImportOzonOrdersPage() {
  const [partnerIdSetting, avgServiceFeeSetting, avgCommissionPercentSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "ozonPartnerId" } }),
    db.settings.findUnique({ where: { field: "ozonAverageServiceFeeRub" } }),
    db.settings.findUnique({ where: { field: "ozonAverageCommissionPercent" } }),
  ]);

  const partnerId = partnerIdSetting?.value ?? null;
  const avgServiceFee = avgServiceFeeSetting ? parseFloat(avgServiceFeeSetting.value) : 0;
  const avgCommissionPercent = avgCommissionPercentSetting ? parseFloat(avgCommissionPercentSetting.value) : 0;

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-[95%] mx-auto">
          <h1 className="admin-form-header mt-10">Импорт заказов Ozon</h1>
          {!partnerId ? (
            <div className="border rounded-md p-4 mt-8 shadow-main text-sm text-amber-700 bg-amber-50">
              Партнёр не настроен. Укажите партнёра на{" "}
              <Link href="/admin/ozon" className="underline">
                странице настроек Ozon
              </Link>
              .
            </div>
          ) : (
            <ImportOzonOrdersClient
              partnerId={partnerId}
              avgServiceFee={avgServiceFee}
              avgCommissionPercent={avgCommissionPercent}
            />
          )}
        </div>
      </div>
    </>
  );
}
