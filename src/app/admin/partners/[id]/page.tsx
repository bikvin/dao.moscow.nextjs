import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { notFound } from "next/navigation";
import { PartnerBasicForm } from "@/components/admin/partner/PartnerBasicForm";
import { AddNameForm } from "@/components/admin/partner/AddNameForm";
import { AddPhoneForm } from "@/components/admin/partner/AddPhoneForm";
import { AddEmailForm } from "@/components/admin/partner/AddEmailForm";
import { AddWebsiteForm } from "@/components/admin/partner/AddWebsiteForm";
import {
  AddAddressForm,
  EditAddressForm,
} from "@/components/admin/partner/AddAddressForm";
import {
  AddLegalEntityForm,
  EditLegalEntityForm,
} from "@/components/admin/partner/AddLegalEntityForm";
import { AddContactPersonForm } from "@/components/admin/partner/AddContactPersonForm";
import { AddCityForm } from "@/components/admin/partner/AddCityForm";
import { AddTransportCompanyForm } from "@/components/admin/partner/AddTransportCompanyForm";
import { AddPartnerTypeForm } from "@/components/admin/partner/AddPartnerTypeForm";
import { AddSampleTypeToAddressForm } from "@/components/admin/partner/AddSampleTypeToAddressForm";
import { DeleteItemButton } from "@/components/admin/partner/DeleteItemButton";
import {
  deletePartnerName,
  setPrimaryPartnerName,
} from "@/actions/partner/names";
import { deletePartnerPhone } from "@/actions/partner/phones";
import { deletePartnerEmail } from "@/actions/partner/emails";
import { deletePartnerWebsite } from "@/actions/partner/websites";
import { deletePartnerAddress } from "@/actions/partner/addresses";
import { deletePartnerLegalEntity } from "@/actions/partner/legalEntities";
import { deletePartnerContactPerson } from "@/actions/partner/contactPersons";
import { removePartnerCity } from "@/actions/partner/cities";
import { removePartnerTransportCompany } from "@/actions/partner/transportCompanies";
import { removePartnerType } from "@/actions/partner/partnerTypes";
import { removeSampleTypeFromAddress } from "@/actions/partner/sampleTypes";
import { deletePartner } from "@/actions/partner/delete";
import Link from "next/link";

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-base font-semibold text-slate-700 mb-2">{title}</h2>
  );
}

function SectionBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="border rounded-md p-4 shadow-main mt-5 border-slate-300">
      {children}
    </div>
  );
}

export default async function PartnerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [
    partner,
    allSampleTypes,
    allCities,
    allTransportCompanies,
    allPartnerTypes,
    allShoppingMalls,
  ] = await Promise.all([
    db.partner.findUnique({
      where: { id: params.id },
      include: {
        names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        phones: { orderBy: { createdAt: "asc" } },
        emails: { orderBy: { createdAt: "asc" } },
        websites: { orderBy: { createdAt: "asc" } },
        addresses: {
          orderBy: { createdAt: "asc" },
          include: { sampleTypes: { orderBy: { name: "asc" } } },
        },
        legalEntities: { orderBy: { createdAt: "asc" } },
        contactPersons: { orderBy: { createdAt: "asc" } },
        cities: { orderBy: { name: "asc" } },
        transportCompanies: { orderBy: { name: "asc" } },
        partnerTypes: { orderBy: { name: "asc" } },
      },
    }),
    db.sampleType.findMany({ orderBy: { name: "asc" } }),
    db.city.findMany({ orderBy: { name: "asc" } }),
    db.transportCompany.findMany({ orderBy: { name: "asc" } }),
    db.partnerType.findMany({ orderBy: { name: "asc" } }),
    db.shoppingMall.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!partner) notFound();

  const displayName =
    partner.names.find((n) => n.isPrimary)?.name ??
    partner.names[0]?.name ??
    "—";

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto pb-16">
          <div className="flex items-center gap-3 mt-10">
            <Link
              href="/admin/partners"
              className="text-sm text-slate-500 hover:underline"
            >
              ← Партнёры
            </Link>
          </div>
          <h1 className="admin-form-header mt-2">{displayName}</h1>

          {/* Names */}
          <SectionBox>
            <SectionHeader title="Названия" />
            {partner.names.length > 0 ? (
              <ul className="flex flex-col gap-1 mb-1">
                {partner.names.map((n) => (
                  <li key={n.id} className="flex items-center gap-3 text-sm">
                    <span className={n.isPrimary ? "font-medium" : ""}>
                      {n.name}
                    </span>
                    {n.isPrimary ? (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                        основное
                      </span>
                    ) : (
                      <form action={setPrimaryPartnerName} className="inline">
                        <input type="hidden" name="id" value={n.id} />
                        <input
                          type="hidden"
                          name="partnerId"
                          value={partner.id}
                        />
                        <button
                          type="submit"
                          className="text-xs text-slate-400 hover:text-blue-600 hover:underline"
                        >
                          сделать основным
                        </button>
                      </form>
                    )}
                    <DeleteItemButton
                      action={deletePartnerName}
                      fields={{ id: n.id, partnerId: partner.id }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет названий</p>
            )}
            <AddNameForm partnerId={partner.id} />
          </SectionBox>

          {/* Partner types */}
          <SectionBox>
            <SectionHeader title="Типы партнёра" />
            {partner.partnerTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-1">
                {partner.partnerTypes.map((pt) => (
                  <span
                    key={pt.id}
                    className="flex items-center gap-1 text-sm bg-slate-100 px-2 py-0.5 rounded"
                  >
                    {pt.name}
                    <DeleteItemButton
                      action={removePartnerType}
                      fields={{ partnerId: partner.id, partnerTypeId: pt.id }}
                    />
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет типов</p>
            )}
            <AddPartnerTypeForm
              partnerId={partner.id}
              allPartnerTypes={allPartnerTypes}
              existingIds={partner.partnerTypes.map((pt) => pt.id)}
            />
          </SectionBox>

          {/* Phones */}
          <SectionBox>
            <SectionHeader title="Телефоны" />
            {partner.phones.length > 0 ? (
              <ul className="flex flex-col gap-1 mb-1">
                {partner.phones.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 text-sm">
                    <span>{p.phone}</span>
                    {p.notes && (
                      <span className="text-slate-500">{p.notes}</span>
                    )}
                    <DeleteItemButton
                      action={deletePartnerPhone}
                      fields={{ id: p.id, partnerId: partner.id }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет телефонов</p>
            )}
            <AddPhoneForm partnerId={partner.id} />
          </SectionBox>

          {/* Emails */}
          <SectionBox>
            <SectionHeader title="Email-адреса" />
            {partner.emails.length > 0 ? (
              <ul className="flex flex-col gap-1 mb-1">
                {partner.emails.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 text-sm">
                    <span>{e.email}</span>
                    {e.notes && (
                      <span className="text-slate-500">{e.notes}</span>
                    )}
                    <DeleteItemButton
                      action={deletePartnerEmail}
                      fields={{ id: e.id, partnerId: partner.id }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет email-адресов</p>
            )}
            <AddEmailForm partnerId={partner.id} />
          </SectionBox>

          {/* Websites */}
          <SectionBox>
            <SectionHeader title="Сайты" />
            {partner.websites.length > 0 ? (
              <ul className="flex flex-col gap-1 mb-1">
                {partner.websites.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 text-sm">
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {w.url}
                    </a>
                    <DeleteItemButton
                      action={deletePartnerWebsite}
                      fields={{ id: w.id, partnerId: partner.id }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет сайтов</p>
            )}
            <AddWebsiteForm partnerId={partner.id} />
          </SectionBox>

          {/* Addresses */}
          <SectionBox>
            <SectionHeader title="Адреса" />
            {partner.addresses.length > 0 ? (
              <div className="flex flex-col gap-4 mb-2">
                {partner.addresses.map((a) => (
                  <div
                    key={a.id}
                    className="border border-slate-300 rounded-md p-3 shadow-md bg-slate-200"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <EditAddressForm partnerId={partner.id} address={a} allShoppingMalls={allShoppingMalls} />
                      <DeleteItemButton
                        action={deletePartnerAddress}
                        fields={{ id: a.id, partnerId: partner.id }}
                      />
                    </div>
                    {/* Sample types for this address */}
                    <div className="pl-1">
                      <p className="text-xs text-slate-500 mb-1">Образцы:</p>
                      {a.sampleTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {a.sampleTypes.map((st) => (
                            <span
                              key={st.id}
                              className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200"
                            >
                              {st.name}
                              <DeleteItemButton
                                action={removeSampleTypeFromAddress}
                                fields={{
                                  partnerId: partner.id,
                                  addressId: a.id,
                                  sampleTypeId: st.id,
                                }}
                              />
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mb-1">
                          Нет образцов
                        </p>
                      )}
                      <AddSampleTypeToAddressForm
                        partnerId={partner.id}
                        addressId={a.id}
                        allSampleTypes={allSampleTypes}
                        existingIds={a.sampleTypes.map((st) => st.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-2">Нет адресов</p>
            )}
            <AddAddressForm partnerId={partner.id} allShoppingMalls={allShoppingMalls} />
          </SectionBox>

          {/* Legal entities */}
          <SectionBox>
            <SectionHeader title="Юридические лица" />
            {partner.legalEntities.length > 0 ? (
              <ul className="flex flex-col gap-1 mb-1">
                {partner.legalEntities.map((le) => (
                  <li
                    key={le.id}
                    className="border border-slate-300 rounded-md p-4 shadow-md bg-slate-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-semibold">{le.name}</span>
                      <DeleteItemButton
                        action={deletePartnerLegalEntity}
                        fields={{ id: le.id, partnerId: partner.id }}
                      />
                    </div>
                    <EditLegalEntityForm
                      partnerId={partner.id}
                      legalEntity={le}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет юр. лиц</p>
            )}
            <AddLegalEntityForm partnerId={partner.id} />
          </SectionBox>

          {/* Contact persons */}
          <SectionBox>
            <SectionHeader title="Контактные лица" />
            {partner.contactPersons.length > 0 ? (
              <ul className="flex flex-col gap-1 mb-1">
                {partner.contactPersons.map((cp) => (
                  <li key={cp.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{cp.name}</span>
                    {cp.role && (
                      <span className="text-slate-500">{cp.role}</span>
                    )}
                    {cp.notes && (
                      <span className="text-slate-400 italic">{cp.notes}</span>
                    )}
                    <DeleteItemButton
                      action={deletePartnerContactPerson}
                      fields={{ id: cp.id, partnerId: partner.id }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет контактных лиц</p>
            )}
            <AddContactPersonForm partnerId={partner.id} />
          </SectionBox>

          {/* Cities */}
          <SectionBox>
            <SectionHeader title="Города" />
            {partner.cities.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-1">
                {partner.cities.map((c) => (
                  <span
                    key={c.id}
                    className="flex items-center gap-1 text-sm bg-slate-100 px-2 py-0.5 rounded"
                  >
                    {c.name}
                    <DeleteItemButton
                      action={removePartnerCity}
                      fields={{ partnerId: partner.id, cityId: c.id }}
                    />
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-1">Нет городов</p>
            )}
            <AddCityForm
              partnerId={partner.id}
              allCities={allCities}
              existingIds={partner.cities.map((c) => c.id)}
            />
          </SectionBox>

          {/* Transport companies */}
          <SectionBox>
            <SectionHeader title="Транспортные компании" />
            {partner.transportCompanies.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-1">
                {partner.transportCompanies.map((tc) => (
                  <span
                    key={tc.id}
                    className="flex items-center gap-1 text-sm bg-slate-100 px-2 py-0.5 rounded"
                  >
                    {tc.name}
                    <DeleteItemButton
                      action={removePartnerTransportCompany}
                      fields={{ partnerId: partner.id, tcId: tc.id }}
                    />
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-1">
                Нет транспортных компаний
              </p>
            )}
            <AddTransportCompanyForm
              partnerId={partner.id}
              allTransportCompanies={allTransportCompanies}
              existingIds={partner.transportCompanies.map((tc) => tc.id)}
            />
          </SectionBox>

          {/* Basic info */}
          <SectionBox>
            <SectionHeader title="Основная информация" />
            <PartnerBasicForm
              id={partner.id}
              status={partner.status}
              prospectNotes={partner.prospectNotes}
            />
          </SectionBox>

          {/* Delete partner */}
          <div className="mt-8 border border-red-200 rounded-md p-4">
            <h2 className="text-base font-semibold text-red-600 mb-2">
              Удалить партнёра
            </h2>
            <p className="text-sm text-slate-500 mb-3">
              Это действие необратимо. Все данные партнёра будут удалены.
            </p>
            <DeleteItemButton
              action={deletePartner}
              fields={{ id: partner.id }}
              message="Удалить партнёра и все его данные? Это действие необратимо."
              label="Удалить партнёра"
            />
          </div>
        </div>
      </div>
    </>
  );
}
