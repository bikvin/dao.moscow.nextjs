import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { SellerSettingsForm } from "@/components/admin/invoice/SellerSettingsForm";

const SELLER_FIELDS = [
  "sellerLegalName",
  "sellerInn",
  "sellerKpp",
  "sellerBankName",
  "sellerShortBankName",
  "sellerBik",
  "sellerBankAccNo",
  "sellerAccNo",
] as const;

export default async function SellerSettingsPage() {
  const rows = await db.settings.findMany({
    where: { field: { in: [...SELLER_FIELDS] } },
  });

  const get = (field: string) => rows.find((r) => r.field === field)?.value ?? "";

  const current = {
    sellerLegalName:     get("sellerLegalName"),
    sellerInn:           get("sellerInn"),
    sellerKpp:           get("sellerKpp"),
    sellerBankName:      get("sellerBankName"),
    sellerShortBankName: get("sellerShortBankName"),
    sellerBik:           get("sellerBik"),
    sellerBankAccNo:     get("sellerBankAccNo"),
    sellerAccNo:         get("sellerAccNo"),
  };

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Реквизиты продавца</h1>
          <SellerSettingsForm current={current} />
        </div>
      </div>
    </>
  );
}
