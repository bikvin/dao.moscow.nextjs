import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { CreateCityForm } from "@/components/admin/partner/CreateCityForm";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deleteCity } from "@/actions/partner/cities";

export default async function CitiesPage() {
  const cities = await db.city.findMany({ orderBy: { name: "asc" } });

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
          <h1 className="admin-form-header mt-2">Города</h1>

          <div className="border rounded-md p-4 shadow-main mt-6">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Добавить город</h2>
            <CreateCityForm />
          </div>

          <div className="border rounded-md p-4 shadow-main mt-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Все города</h2>
            {cities.length === 0 ? (
              <p className="text-sm text-slate-400">Нет городов</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cities.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <span>{c.name}</span>
                    <DeleteItemButton action={deleteCity} fields={{ id: c.id }} />
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
