import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { CreateTransportCompanyForm } from "@/components/admin/partner/CreateTransportCompanyForm";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import { deleteTransportCompany } from "@/actions/partner/transportCompanies";

export default async function TransportCompaniesPage() {
  const companies = await db.transportCompany.findMany({ orderBy: { name: "asc" } });

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
          <h1 className="admin-form-header mt-2">Транспортные компании</h1>

          <div className="border rounded-md p-4 shadow-main mt-6">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Добавить компанию</h2>
            <CreateTransportCompanyForm />
          </div>

          <div className="border rounded-md p-4 shadow-main mt-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Все компании</h2>
            {companies.length === 0 ? (
              <p className="text-sm text-slate-400">Нет транспортных компаний</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {companies.map((tc) => (
                  <li key={tc.id} className="flex items-center gap-3 text-sm">
                    <span>{tc.name}</span>
                    <DeleteItemButton action={deleteTransportCompany} fields={{ id: tc.id }} />
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
