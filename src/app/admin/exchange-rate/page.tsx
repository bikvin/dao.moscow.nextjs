import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";

export default async function ExchangeRatePage() {
  const officialRateSetting = await db.settings.findUnique({
    where: { field: "usdOfficialRate" },
  });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Курс валют</h1>

          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-3">Официальный курс ЦБ РФ</h2>
            {officialRateSetting ? (
              <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-slate-700 font-medium">
                  1 USD = {parseFloat(officialRateSetting.value).toFixed(2)} ₽
                </span>
                <span className="text-slate-400">
                  Обновлено: {new Date(officialRateSetting.updatedAt).toLocaleString("ru-RU")} UTC
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Данные ещё не загружены</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
