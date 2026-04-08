"use client";

import { useFormState } from "react-dom";
import { updatePartner } from "@/actions/partner/update";
import { PartnerStatusEnum } from "@prisma/client";
import FormButton from "@/components/common/formButton/formButton";
import { PartnerFormState } from "@/actions/partner/PartnerFormState";

const STATUS_LABELS: Record<PartnerStatusEnum, string> = {
  PROSPECT: "Потенциальный",
  ACTIVE: "Активный",
  INACTIVE: "Неактивный",
};

export function PartnerBasicForm({
  id,
  status,
  prospectNotes,
}: {
  id: string;
  status: PartnerStatusEnum;
  prospectNotes: string | null;
}) {
  const boundAction = updatePartner.bind(null, id);
  const [formState, action] = useFormState<PartnerFormState, FormData>(boundAction, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600 w-40">Статус:</label>
        <select name="status" defaultValue={status} className="admin-form-input text-sm w-48">
          {Object.values(PartnerStatusEnum).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-3">
        <label className="text-sm text-slate-600 w-40 pt-1">Заметки:</label>
        <textarea
          name="prospectNotes"
          defaultValue={prospectNotes ?? ""}
          rows={4}
          className="admin-form-input text-sm flex-1 resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <FormButton color="blue" small>
          Сохранить
        </FormButton>
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
