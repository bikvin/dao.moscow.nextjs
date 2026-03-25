import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { MainRateForm } from "@/components/admin/exchange-rate/MainRateForm";
import Link from "next/link";

export default async function ExchangeRateSettingsPage() {
  const [modeSetting, markupSetting, manualSetting] = await Promise.all([
    db.settings.findUnique({ where: { field: "usdMainRateMode" } }),
    db.settings.findUnique({ where: { field: "usdMainRateMarkup" } }),
    db.settings.findUnique({ where: { field: "usdMainRateManual" } }),
  ]);

  const currentMode = (modeSetting?.value ?? "official") as "official" | "markup" | "manual";
  const currentMarkup = parseFloat(markupSetting?.value ?? "0");
  const currentManual = parseFloat(manualSetting?.value ?? "0");

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Настройка рабочего курса</h1>

          <div className="border rounded-md p-4 mt-8 shadow-main">
            <h2 className="text-lg font-medium mb-4">Рабочий курс USD</h2>
            <MainRateForm
              currentMode={currentMode}
              currentMarkup={currentMarkup}
              currentManual={currentManual}
            />
          </div>

          <div className="mt-6">
            <Link href="/admin/exchange-rate" className="link-button">
              Назад
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
