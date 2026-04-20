import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { CreateDeliveryMethodForm, EditDeliveryMethodForm } from "@/components/admin/order/DeliveryMethodForms";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deleteDeliveryMethod } from "@/actions/order/deliveryMethods";

export default async function DeliveryMethodsPage() {
  const methods = await db.deliveryMethod.findMany({ orderBy: { name: "asc" } });

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
          <h1 className="admin-form-header mt-2">Способы доставки</h1>

          <div className="border rounded-md p-4 shadow-main mt-6">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Добавить способ доставки</h2>
            <CreateDeliveryMethodForm />
          </div>

          <div className="border rounded-md p-4 shadow-main mt-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Все способы доставки</h2>
            {methods.length === 0 ? (
              <p className="text-sm text-slate-400">Нет способов доставки</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {methods.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <EditDeliveryMethodForm method={m} />
                    <DeleteItemButton action={deleteDeliveryMethod} fields={{ id: m.id }} />
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
