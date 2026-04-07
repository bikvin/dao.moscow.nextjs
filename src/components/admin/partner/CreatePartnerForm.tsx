"use client";

import { useFormState } from "react-dom";
import { createPartner } from "@/actions/partner/create";
import { PartnerFormState } from "@/actions/partner/PartnerFormState";
import { PartnerStatusEnum } from "@prisma/client";
import FormButton from "@/components/common/formButton/formButton";

const STATUS_LABELS: Record<PartnerStatusEnum, string> = {
  PROSPECT: "Потенциальный",
  ACTIVE: "Активный",
  INACTIVE: "Неактивный",
};

export function CreatePartnerForm() {
  const [formState, action] = useFormState<PartnerFormState, FormData>(createPartner, {});

  return (
    <form action={action} className="flex flex-col gap-4 mt-6">
      <div>
        <label className="text-sm text-slate-600 block mb-1">Название *</label>
        <input
          name="name"
          type="text"
          className="admin-form-input w-full"
          placeholder="Основное название партнёра"
        />
        {formState.errors?.name && (
          <p className="text-red-600 text-sm mt-1">{formState.errors.name.join(", ")}</p>
        )}
      </div>

      <div>
        <label className="text-sm text-slate-600 block mb-1">Статус</label>
        <select name="status" defaultValue={PartnerStatusEnum.ACTIVE} className="admin-form-input w-48">
          {Object.values(PartnerStatusEnum).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-slate-600 block mb-1">Заметки</label>
        <textarea
          name="prospectNotes"
          rows={3}
          className="admin-form-input w-full resize-y"
          placeholder="История взаимодействий, звонки, письма..."
        />
      </div>

      {formState.errors?._form && (
        <p className="text-red-600 text-sm">{formState.errors._form.join(", ")}</p>
      )}

      <div>
        <FormButton color="green">Создать партнёра</FormButton>
      </div>
    </form>
  );
}
