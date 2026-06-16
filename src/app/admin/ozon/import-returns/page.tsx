import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { OzonReturnsDebugClient } from "@/components/admin/ozon/OzonReturnsDebugClient";
import Link from "next/link";

// Page for previewing Ozon FBS return candidates grouped by posting_number.
// Import functionality is not yet implemented — this page is for verifying the data.
export default function OzonImportReturnsPage() {
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
          <OzonReturnsDebugClient />
        </div>
      </div>
    </>
  );
}
