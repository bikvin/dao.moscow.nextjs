import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { CreateSampleTypeForm } from "@/components/admin/partner/CreateSampleTypeForm";
import { EditSampleTypeForm } from "@/components/admin/partner/EditSampleTypeForm";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deleteSampleType } from "@/actions/partner/sampleTypes";

export default async function SampleTypesPage() {
  const sampleTypes = await db.sampleType.findMany({ orderBy: { name: "asc" } });

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
          <h1 className="admin-form-header mt-2">Типы образцов</h1>

          <div className="border rounded-md p-4 shadow-main mt-6">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Добавить тип образца</h2>
            <CreateSampleTypeForm />
          </div>

          <div className="border rounded-md p-4 shadow-main mt-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Все типы образцов</h2>
            {sampleTypes.length === 0 ? (
              <p className="text-sm text-slate-400">Нет типов образцов</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sampleTypes.map((st) => (
                  <li key={st.id} className="flex items-center gap-3">
                    <EditSampleTypeForm sampleType={st} />
                    <DeleteItemButton action={deleteSampleType} fields={{ id: st.id }} />
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
