"use client";

import { useFormState } from "react-dom";
import { saveSellerSettings, type SellerSettingsFormState } from "@/actions/invoice/saveSellerSettings";
import FormButton from "@/components/common/formButton/formButton";

type SellerSettings = {
  sellerLegalName: string;
  sellerInn: string;
  sellerKpp: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerBankName: string;
  sellerShortBankName: string;
  sellerBik: string;
  sellerBankAccNo: string;
  sellerAccNo: string;
};

const FIELDS: { name: keyof SellerSettings; label: string }[] = [
  { name: "sellerLegalName",     label: "Полное наименование" },
  { name: "sellerInn",           label: "ИНН" },
  { name: "sellerKpp",           label: "КПП" },
  { name: "sellerAddress",       label: "Юридический адрес" },
  { name: "sellerPhone",         label: "Телефон" },
  { name: "sellerBankName",      label: "Название банка" },
  { name: "sellerShortBankName", label: "Краткое название банка" },
  { name: "sellerBik",           label: "БИК" },
  { name: "sellerBankAccNo",     label: "Корреспондентский счёт" },
  { name: "sellerAccNo",         label: "Расчётный счёт" },
];

export function SellerSettingsForm({ current }: { current: SellerSettings }) {
  const [formState, action] = useFormState<SellerSettingsFormState, FormData>(
    saveSellerSettings,
    {}
  );

  return (
    <form action={action} className="admin-form">
      {FIELDS.map(({ name, label }) => (
        <div key={name} className="form-item">
          <label htmlFor={name}>{label}</label>
          <input
            id={name}
            name={name}
            type="text"
            defaultValue={current[name]}
            className="admin-form-input"
          />
        </div>
      ))}

      <FormButton>Сохранить</FormButton>

      {formState.errors?._form && (
        <p className="text-red-600 text-sm mt-2">{formState.errors._form.join(", ")}</p>
      )}
      {formState.success && (
        <p className="text-green-600 text-sm mt-2">{formState.success.message}</p>
      )}
    </form>
  );
}
