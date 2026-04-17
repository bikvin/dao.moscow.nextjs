"use client";

import { useState } from "react";
import Link from "next/link";
import { PartnerStatusEnum } from "@prisma/client";
import { ChevronDown, ChevronUp } from "lucide-react";

const STATUS_LABELS: Record<PartnerStatusEnum, string> = {
  PROSPECT: "Потенциальный",
  ACTIVE: "Активный",
  INACTIVE: "Неактивный",
};

const STATUS_COLORS: Record<PartnerStatusEnum, string> = {
  PROSPECT: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
};

type Address = {
  id: string;
  address: string;
  type: string;
  shoppingMall: { id: string; name: string } | null;
  sampleTypes: { id: string; name: string }[];
};

type PartnerCardProps = {
  id: string;
  status: PartnerStatusEnum;
  names: { id: string; name: string; isPrimary: boolean }[];
  phones: { id: string; phone: string; notes: string | null }[];
  emails: { id: string; email: string; notes: string | null }[];
  cities: { id: string; name: string }[];
  partnerTypes: { id: string; name: string }[];
  websites: { id: string; url: string }[];
  transportCompanies: { id: string; comment: string | null; transportCompany: { id: string; name: string } }[];
  legalEntities: {
    id: string; name: string; inn: string | null; kpp: string | null; ogrn: string | null;
    legalAddress: string | null; actualAddress: string | null; phones: string | null;
    bankName: string | null; bik: string | null; checkingAccount: string | null; correspondentAccount: string | null;
  }[];
  contactPersons: { id: string; name: string; role: string | null }[];
  addresses: Address[];
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-slate-400 w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">{children}</div>
    </div>
  );
}

export function PartnerCard({
  id,
  status,
  names,
  websites,
  transportCompanies,
  legalEntities,
  phones,
  emails,
  cities,
  partnerTypes,
  contactPersons,
  addresses,
}: PartnerCardProps) {
  const [expanded, setExpanded] = useState(false);

  const primaryName = names.find((n) => n.isPrimary) ?? names[0];
  const secondaryNames = names.filter((n) => n !== primaryName);

  const hasDetails =
    phones.length > 0 ||
    emails.length > 0 ||
    websites.length > 0 ||
    transportCompanies.length > 0 ||
    legalEntities.length > 0 ||
    partnerTypes.length > 0 ||
    cities.length > 0 ||
    contactPersons.length > 0 ||
    addresses.length > 0;

  return (
    <div className="border rounded-md shadow-main overflow-hidden">
      {/* Always-visible header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-3 hover:bg-slate-50 flex flex-wrap items-center gap-x-4 gap-y-1"
      >
        <span className="font-semibold text-sm">{primaryName?.name ?? "—"}</span>
        {secondaryNames.map((n) => (
          <span key={n.id} className="text-sm text-slate-500">{n.name}</span>
        ))}
        {status !== PartnerStatusEnum.ACTIVE && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        )}
        {hasDetails && (
          <span className="text-slate-400 ml-auto">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </button>

      {/* Expandable details */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex flex-col gap-2">

            {partnerTypes.length > 0 && (
              <DetailRow label="Тип">
                {partnerTypes.map((pt) => (
                  <span key={pt.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {pt.name}
                  </span>
                ))}
              </DetailRow>
            )}

            {cities.length > 0 && (
              <DetailRow label="Города">
                {cities.map((c) => (
                  <span key={c.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {c.name}
                  </span>
                ))}
              </DetailRow>
            )}

            {phones.length > 0 && (
              <DetailRow label="Телефоны">
                {phones.map((p) => (
                  <span key={p.id} className="text-sm text-slate-700">
                    {p.phone}
                    {p.notes && <span className="text-slate-400 ml-1">({p.notes})</span>}
                  </span>
                ))}
              </DetailRow>
            )}

            {emails.length > 0 && (
              <DetailRow label="Почта">
                {emails.map((e) => (
                  <span key={e.id} className="text-sm text-slate-700">
                    {e.email}
                    {e.notes && <span className="text-slate-400 ml-1">({e.notes})</span>}
                  </span>
                ))}
              </DetailRow>
            )}

            {websites.length > 0 && (
              <DetailRow label="Сайты">
                {websites.map((w) => (
                  <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    {w.url}
                  </a>
                ))}
              </DetailRow>
            )}

            {transportCompanies.length > 0 && (
              <DetailRow label="Транспорт">
                {transportCompanies.map((tc) => (
                  <span key={tc.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {tc.transportCompany.name}
                    {tc.comment && <span className="text-slate-400 ml-1">({tc.comment})</span>}
                  </span>
                ))}
              </DetailRow>
            )}

            {legalEntities.length > 0 && (
              <DetailRow label="Юр. лица">
                <div className="flex flex-col gap-2">
                  {legalEntities.map((le) => (
                    <div key={le.id} className="text-sm text-slate-700 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="font-medium">{le.name}</span>
                      {le.inn && <span className="text-slate-500">ИНН: {le.inn}</span>}
                      {le.kpp && <span className="text-slate-500">КПП: {le.kpp}</span>}
                      {le.ogrn && <span className="text-slate-500">ОГРН: {le.ogrn}</span>}
                      {le.legalAddress && <span className="text-slate-500">Юр. адрес: {le.legalAddress}</span>}
                      {le.actualAddress && <span className="text-slate-500">Факт. адрес: {le.actualAddress}</span>}
                      {le.phones && <span className="text-slate-500">Тел: {le.phones}</span>}
                      {le.bankName && <span className="text-slate-500">Банк: {le.bankName}</span>}
                      {le.bik && <span className="text-slate-500">БИК: {le.bik}</span>}
                      {le.checkingAccount && <span className="text-slate-500">Р/с: {le.checkingAccount}</span>}
                      {le.correspondentAccount && <span className="text-slate-500">К/с: {le.correspondentAccount}</span>}
                    </div>
                  ))}
                </div>
              </DetailRow>
            )}

            {contactPersons.length > 0 && (
              <DetailRow label="Контакты">
                {contactPersons.map((cp) => (
                  <span key={cp.id} className="text-sm text-slate-700">
                    {cp.name}
                    {cp.role && <span className="text-slate-400 ml-1">— {cp.role}</span>}
                  </span>
                ))}
              </DetailRow>
            )}

            {addresses.length > 0 && (
              <DetailRow label="Адреса">
                <div className="flex flex-col gap-5">
                  {addresses.map((a) => (
                    <div key={a.id} className="flex flex-col gap-1 bg-slate-200 border border-slate-300 rounded-md px-3 py-2">
                      <span className="text-sm text-slate-700">{a.address}</span>
                      {(a.shoppingMall || a.sampleTypes.length > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {a.shoppingMall && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {a.shoppingMall.name}
                            </span>
                          )}
                          {a.sampleTypes.map((st) => (
                            <span key={st.id} className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                              {st.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DetailRow>
            )}

            <div className="mt-1">
              <Link
                href={`/admin/partners/${id}`}
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Редактировать →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
