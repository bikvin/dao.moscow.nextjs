"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { saveOzonPartner } from "@/actions/ozon/saveOzonPartner";

type PartnerOption = { id: string; name: string };

// Lets the user select which partner represents Ozon orders.
// The selected partner is auto-assigned to all imported Ozon orders.
export function OzonPartnerForm({
  partners,
  currentPartnerId,
}: {
  partners: PartnerOption[];
  currentPartnerId: string | null;
}) {
  const [formState, action] = useFormState(saveOzonPartner, {});

  return (
    <form action={action} className="flex items-center gap-3">
      <label className="text-sm text-slate-600">Партнёр (Ozon):</label>
      {partners.length === 0 ? (
        <span className="text-sm text-red-600">Создайте партнёра</span>
      ) : (
        <select
          name="partnerId"
          defaultValue={currentPartnerId ?? ""}
          className="admin-form-input text-sm"
        >
          {!currentPartnerId && <option value="">Выберите партнёра...</option>}
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      <FormButton color="blue" small>Сохранить</FormButton>
      {formState.errors?._form && (
        <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
      )}
      {formState.success && (
        <span className="text-emerald-600 text-sm">{formState.success.message}</span>
      )}
    </form>
  );
}
