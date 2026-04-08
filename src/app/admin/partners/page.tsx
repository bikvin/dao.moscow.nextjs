import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import Link from "next/link";
import { Pagination } from "@/components/admin/Pagination";
import { PartnerStatusEnum } from "@prisma/client";
import { PartnerCard } from "@/components/admin/partner/PartnerCard";

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<PartnerStatusEnum, string> = {
  PROSPECT: "Потенциальный",
  ACTIVE: "Активный",
  INACTIVE: "Неактивный",
};


export default async function PartnersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const search = searchParams.search ?? "";
  const statusFilter = searchParams.status !== undefined
    ? (searchParams.status as PartnerStatusEnum | "")
    : PartnerStatusEnum.ACTIVE;

  const where = {
    ...(search && {
      names: { some: { name: { contains: search, mode: "insensitive" as const } } },
    }),
    ...(statusFilter && { status: statusFilter }),
  };

  const [partners, total] = await Promise.all([
    db.partner.findMany({
      where,
      include: {
        names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        phones: { orderBy: { createdAt: "asc" } },
        emails: { orderBy: { createdAt: "asc" } },
        cities: { orderBy: { name: "asc" } },
        partnerTypes: { orderBy: { name: "asc" } },
        contactPersons: { orderBy: { createdAt: "asc" } },
        addresses: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.partner.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Партнёры</h1>

          <div className="mt-6 flex flex-wrap gap-3 items-center justify-between">
            <form className="flex gap-2 flex-wrap">
              <input
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Поиск по названию"
                className="admin-form-input text-sm w-56"
              />
              <select name="status" defaultValue={statusFilter} className="admin-form-input text-sm w-44">
                <option value="">Все статусы</option>
                {Object.values(PartnerStatusEnum).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button type="submit" className="link-button link-button-gray text-sm">
                Найти
              </button>
            </form>
            <Link href="/admin/partners/create" className="link-button link-button-green">
              Добавить партнёра
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {partners.length === 0 && (
              <p className="text-slate-400 text-sm">Партнёры не найдены</p>
            )}
            {partners.map((p) => (
              <PartnerCard
                key={p.id}
                id={p.id}
                status={p.status}
                createdAt={p.createdAt}
                names={p.names}
                phones={p.phones}
                emails={p.emails}
                cities={p.cities}
                partnerTypes={p.partnerTypes}
                contactPersons={p.contactPersons}
                addresses={p.addresses}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/partners"
            searchParams={searchParams}
          />
        </div>
      </div>
    </>
  );
}
