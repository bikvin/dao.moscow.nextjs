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

type PartnerCardProps = {
  id: string;
  status: PartnerStatusEnum;
  createdAt: Date;
  names: { id: string; name: string; isPrimary: boolean }[];
  phones: { id: string; phone: string; notes: string | null }[];
  emails: { id: string; email: string; notes: string | null }[];
  cities: { id: string; name: string }[];
  partnerTypes: { id: string; name: string }[];
  contactPersons: { id: string; name: string; role: string | null }[];
  addresses: { id: string; address: string; type: string }[];
};

export function PartnerCard({
  id,
  status,
  createdAt,
  names,
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
    partnerTypes.length > 0 ||
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
        {cities.length > 0 && (
          <span className="text-xs text-slate-500">{cities.map((c) => c.name).join(", ")}</span>
        )}
        <span className="text-xs text-slate-400 ml-auto flex items-center gap-2">
          {new Date(createdAt).toLocaleDateString("ru-RU")}
          {hasDetails && (
            expanded
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {/* Expandable details */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-1 border-t border-slate-100 flex flex-col gap-2">
            {partnerTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {partnerTypes.map((pt) => (
                  <span key={pt.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {pt.name}
                  </span>
                ))}
              </div>
            )}

            {phones.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {phones.map((p) => (
                  <span key={p.id} className="text-sm text-slate-700">
                    {p.phone}
                    {p.notes && <span className="text-slate-400 ml-1">({p.notes})</span>}
                  </span>
                ))}
              </div>
            )}

            {emails.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {emails.map((e) => (
                  <span key={e.id} className="text-sm text-slate-700">
                    {e.email}
                    {e.notes && <span className="text-slate-400 ml-1">({e.notes})</span>}
                  </span>
                ))}
              </div>
            )}

            {contactPersons.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {contactPersons.map((cp) => (
                  <span key={cp.id} className="text-sm text-slate-700">
                    {cp.name}
                    {cp.role && <span className="text-slate-400 ml-1">— {cp.role}</span>}
                  </span>
                ))}
              </div>
            )}

            {addresses.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {addresses.map((a) => (
                  <span key={a.id} className="text-sm text-slate-700">{a.address}</span>
                ))}
              </div>
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
