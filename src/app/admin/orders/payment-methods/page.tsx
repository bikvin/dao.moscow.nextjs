import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { CreatePaymentMethodForm, EditPaymentMethodForm } from "@/components/admin/order/PaymentMethodForms";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deletePaymentMethod } from "@/actions/order/paymentMethods";

export default async function PaymentMethodsPage() {
  const methods = await db.paymentMethod.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <div className="mt-10">
            <Link href="/admin" className="text-sm text-slate-500 hover:underline">
              ← Заказы
            </Link>
          </div>
          <h1 className="admin-form-header mt-2">Способы оплаты</h1>

          <div className="border rounded-md p-4 shadow-main mt-6">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Добавить способ оплаты</h2>
            <CreatePaymentMethodForm />
          </div>

          <div className="border rounded-md p-4 shadow-main mt-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Все способы оплаты</h2>
            {methods.length === 0 ? (
              <p className="text-sm text-slate-400">Нет способов оплаты</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {methods.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <EditPaymentMethodForm method={m} />
                    <DeleteItemButton action={deletePaymentMethod} fields={{ id: m.id }} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
