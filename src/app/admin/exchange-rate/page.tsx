import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";

function modeLabel(mode: string, markup: number): string {
  if (mode === "markup") return `Официальный + наценка ${markup}%`;
  if (mode === "manual") return "Ручной";
  return "Равен официальному";
}

export default async function ExchangeRatePage() {
  const [officialRateSetting, mainRateSetting, modeSetting, markupSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "usdOfficialRate" } }),
    db.settings.findUnique({ where: { field: "usdMainRate" } }),
    db.settings.findUnique({ where: { field: "usdMainRateMode" } }),
    db.settings.findUnique({ where: { field: "usdMainRateMarkup" } }),
  ]);

  const officialRate = officialRateSetting ? parseFloat(officialRateSetting.value) : null;
  const mainRate = mainRateSetting ? parseFloat(mainRateSetting.value) : null;
  const mode = modeSetting?.value ?? "official";
  const markup = parseFloat(markupSetting?.value ?? "0");

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Курс валют</h1>

          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-3">Официальный курс ЦБ РФ</h2>
            {officialRateSetting && officialRate !== null ? (
              <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-slate-700 font-medium">
                  1 USD = {officialRate.toFixed(2)} ₽
                </span>
                <span className="text-slate-400">
                  Обновлено: {new Date(officialRateSetting.updatedAt).toLocaleString("ru-RU")} UTC
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Данные ещё не загружены</p>
            )}
          </div>

          <div className="border rounded-md p-4 mt-4 shadow-main">
            <h2 className="text-lg font-medium mb-3">Рабочий курс</h2>
            <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
              {mainRate !== null ? (
                <span className="text-slate-700 font-medium">
                  1 USD = {mainRate.toFixed(2)} ₽
                </span>
              ) : (
                <span className="text-slate-400">Нет данных</span>
              )}
              <span className="text-slate-400">{modeLabel(mode, markup)}</span>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/admin/exchange-rate/settings" className="link-button link-button-blue">
              Настройки
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
