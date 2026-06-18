import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { ImportOzonReturnsClient } from "@/components/admin/ozon/ImportOzonReturnsClient";
import { db } from "@/db";
import Link from "next/link";

// Page for importing Ozon FBS returns. Fetches return candidates from the Ozon API,
// shows financial breakdown per posting, and allows bulk import into the orders table.
export default async function OzonImportReturnsPage() {
  const partnerIdSetting = await db.settings.findUnique({ where: { field: "ozonPartnerId" } });
  const partnerId = partnerIdSetting?.value ?? "";

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-xl mx-auto">
        <div className="w-[95%] mx-auto pb-16">
          <h1 className="admin-form-header mt-10">Возвраты Ozon</h1>
          <div className="mt-2 flex gap-4">
            <Link href="/admin/ozon" className="text-sm text-blue-500 hover:underline">
              ← Настройки Ozon
            </Link>
          </div>
          {!partnerId && (
            <p className="mt-4 text-amber-600 text-sm">
              Партнёр Ozon не задан в настройках — импорт недоступен.
            </p>
          )}
          <ImportOzonReturnsClient partnerId={partnerId} />
        </div>
      </div>
    </>
  );
}
