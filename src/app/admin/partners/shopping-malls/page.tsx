import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { CreateShoppingMallForm } from "@/components/admin/partner/CreateShoppingMallForm";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deleteShoppingMall } from "@/actions/partner/shoppingMalls";

export default async function ShoppingMallsPage() {
  const malls = await db.shoppingMall.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <div className="mt-10">
            <Link href="/admin/partners" className="text-sm text-slate-500 hover:underline">
              ← Партнёры
            </Link>
          </div>
          <h1 className="admin-form-header mt-2">Торговые центры</h1>

          <div className="border rounded-md p-4 shadow-main mt-6">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Добавить ТЦ</h2>
            <CreateShoppingMallForm />
          </div>

          <div className="border rounded-md p-4 shadow-main mt-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Все ТЦ</h2>
            {malls.length === 0 ? (
              <p className="text-sm text-slate-400">Нет торговых центров</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {malls.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 text-sm">
                    <span>{m.name}</span>
                    <DeleteItemButton action={deleteShoppingMall} fields={{ id: m.id }} />
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
