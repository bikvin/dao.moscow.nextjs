"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { addPartnerLegalEntity, updatePartnerLegalEntity } from "@/actions/partner/legalEntities";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { PartnerLegalEntity } from "@prisma/client";
import FormButton from "@/components/common/formButton/formButton";

type FieldValues = {
  name: string; inn: string; kpp: string; ogrn: string;
  legalAddress: string; actualAddress: string; phones: string;
  bankName: string; bik: string; checkingAccount: string; correspondentAccount: string;
};

const EMPTY: FieldValues = {
  name: "", inn: "", kpp: "", ogrn: "",
  legalAddress: "", actualAddress: "", phones: "",
  bankName: "", bik: "", checkingAccount: "", correspondentAccount: "",
};

function fromEntity(le: PartnerLegalEntity): FieldValues {
  return {
    name: le.name, inn: le.inn ?? "", kpp: le.kpp ?? "", ogrn: le.ogrn ?? "",
    legalAddress: le.legalAddress ?? "", actualAddress: le.actualAddress ?? "",
    phones: le.phones ?? "", bankName: le.bankName ?? "", bik: le.bik ?? "",
    checkingAccount: le.checkingAccount ?? "", correspondentAccount: le.correspondentAccount ?? "",
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-500 w-48 shrink-0">{label}</label>
      {children}
    </div>
  );
}

function LegalEntityFields({
  values,
  onChange,
}: {
  values: FieldValues;
  onChange: (field: keyof FieldValues, value: string) => void;
}) {
  return (
    <>
      <Row label="Название *">
        <input name="name" type="text" value={values.name} onChange={(e) => onChange("name", e.target.value)} className="admin-form-input text-sm flex-1" />
      </Row>
      <Row label="ИНН">
        <input name="inn" type="text" value={values.inn} onChange={(e) => onChange("inn", e.target.value)} className="admin-form-input text-sm w-40" />
      </Row>
      <Row label="КПП">
        <input name="kpp" type="text" value={values.kpp} onChange={(e) => onChange("kpp", e.target.value)} className="admin-form-input text-sm w-40" />
      </Row>
      <Row label="ОГРН / ОГРНИП">
        <input name="ogrn" type="text" value={values.ogrn} onChange={(e) => onChange("ogrn", e.target.value)} className="admin-form-input text-sm w-48" />
      </Row>
      <Row label="Юридический адрес">
        <input name="legalAddress" type="text" value={values.legalAddress} onChange={(e) => onChange("legalAddress", e.target.value)} className="admin-form-input text-sm flex-1" />
      </Row>
      <Row label="Фактический адрес">
        <input name="actualAddress" type="text" value={values.actualAddress} onChange={(e) => onChange("actualAddress", e.target.value)} className="admin-form-input text-sm flex-1" />
      </Row>
      <Row label="Телефоны">
        <input name="phones" type="text" value={values.phones} onChange={(e) => onChange("phones", e.target.value)} className="admin-form-input text-sm flex-1" />
      </Row>
      <Row label="Банк">
        <input name="bankName" type="text" value={values.bankName} onChange={(e) => onChange("bankName", e.target.value)} className="admin-form-input text-sm flex-1" />
      </Row>
      <Row label="БИК">
        <input name="bik" type="text" value={values.bik} onChange={(e) => onChange("bik", e.target.value)} className="admin-form-input text-sm w-40" />
      </Row>
      <Row label="Расчётный счёт">
        <input name="checkingAccount" type="text" value={values.checkingAccount} onChange={(e) => onChange("checkingAccount", e.target.value)} className="admin-form-input text-sm flex-1" />
      </Row>
      <Row label="Корреспондентский счёт">
        <input name="correspondentAccount" type="text" value={values.correspondentAccount} onChange={(e) => onChange("correspondentAccount", e.target.value)} className="admin-form-input text-sm flex-1" />
      </Row>
    </>
  );
}

export function AddLegalEntityForm({ partnerId }: { partnerId: string }) {
  const boundAction = addPartnerLegalEntity.bind(null, partnerId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [values, setValues] = useState<FieldValues>(EMPTY);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (formState.success) {
      setValues(EMPTY);
      setOpen(false);
    }
  }, [formState.success]);

  function onChange(field: keyof FieldValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-emerald-600 hover:underline"
      >
        {open ? "Свернуть" : "+ Добавить юридическое лицо"}
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border border-slate-200 rounded-md p-4 mt-3">
            <p className="text-sm font-medium text-slate-600 mb-3">Новое юридическое лицо</p>
            <form action={action} className="flex flex-col gap-3">
              <LegalEntityFields values={values} onChange={onChange} />
              <div className="flex items-center gap-3 mt-1">
                <FormButton color="green" small>Добавить</FormButton>
                {formState.errors?._form && (
                  <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditLegalEntityForm({
  partnerId,
  legalEntity,
}: {
  partnerId: string;
  legalEntity: PartnerLegalEntity;
}) {
  const boundAction = updatePartnerLegalEntity.bind(null, partnerId, legalEntity.id);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [values, setValues] = useState<FieldValues>(() => fromEntity(legalEntity));

  function onChange(field: keyof FieldValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form action={action} className="flex flex-col gap-3 mt-2">
      <LegalEntityFields values={values} onChange={onChange} />
      <div className="flex items-center gap-3 mt-1">
        <FormButton color="blue" small>Сохранить</FormButton>
        {formState.errors?._form && (
          <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
        )}
        {formState.success && (
          <span className="text-emerald-600 text-sm">{formState.success.message}</span>
        )}
      </div>
    </form>
  );
}
