import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { TaxSettingsForm } from "@/components/admin/settings/TaxSettingsForm";
import { requireAdmin } from "@/lib/requireAdmin";

// Admin-only settings page for tax rate, merchant commission, and the payment methods each applies to.
export default async function TaxSettingsPage() {
  await requireAdmin();

  const [taxRateSetting, taxableIdsSetting, commissionRateSetting, commissionIdsSetting, paymentMethods] =
    await Promise.all([
      db.settings.findUnique({ where: { field: "taxRate" } }),
      db.settings.findUnique({ where: { field: "taxablePaymentMethodIds" } }),
      db.settings.findUnique({ where: { field: "commissionRate" } }),
      db.settings.findUnique({ where: { field: "commissionPaymentMethodIds" } }),
      db.paymentMethod.findMany({ orderBy: { name: "asc" } }),
    ]);

  const currentRate = taxRateSetting ? parseFloat(taxRateSetting.value) : null;
  const currentCommissionRate = commissionRateSetting ? parseFloat(commissionRateSetting.value) : null;
  const taxablePaymentMethodIds: string[] = taxableIdsSetting ? JSON.parse(taxableIdsSetting.value) : [];
  const commissionPaymentMethodIds: string[] = commissionIdsSetting ? JSON.parse(commissionIdsSetting.value) : [];

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto pb-16">
          <h1 className="admin-form-header mt-10">Настройки налога и комиссий</h1>

          <div className="border rounded-md p-6 shadow-main bg-white flex flex-col gap-4 mt-6">
            <p className="text-sm text-slate-500">
              Налог и комиссия эквайринга вычитаются из выручки при расчёте маржи для выбранных способов оплаты.
            </p>
            <TaxSettingsForm
              currentRate={currentRate}
              currentCommissionRate={currentCommissionRate}
              paymentMethods={paymentMethods}
              taxablePaymentMethodIds={taxablePaymentMethodIds}
              commissionPaymentMethodIds={commissionPaymentMethodIds}
            />
          </div>
        </div>
      </div>
    </>
  );
}
