import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { CreatePartnerTypeForm } from "@/components/admin/partner/CreatePartnerTypeForm";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deletePartnerType } from "@/actions/partner/partnerTypes";

export default async function PartnerTypesPage() {
  const partnerTypes = await db.partnerType.findMany({ orderBy: { name: "asc" } });

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
          <h1 className="admin-form-header mt-2">Типы партнёров</h1>

          <div className="border rounded-md p-4 shadow-main mt-6">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Добавить тип</h2>
            <CreatePartnerTypeForm />
          </div>

          <div className="border rounded-md p-4 shadow-main mt-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Все типы</h2>
            {partnerTypes.length === 0 ? (
              <p className="text-sm text-slate-400">Нет типов</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {partnerTypes.map((pt) => (
                  <li key={pt.id} className="flex items-center gap-3 text-sm">
                    <span>{pt.name}</span>
                    <DeleteItemButton action={deletePartnerType} fields={{ id: pt.id }} />
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
