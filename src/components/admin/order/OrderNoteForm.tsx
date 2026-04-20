"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { updateOrderNote } from "@/actions/order/orders";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import FormButton from "@/components/common/formButton/formButton";

export function OrderNoteForm({
  orderId,
  initialNote,
}: {
  orderId: string;
  initialNote: string | null;
}) {
  const boundAction = updateOrderNote.bind(null, orderId);
  const [formState, action] = useFormState<SubItemFormState, FormData>(boundAction, {});
  const [note, setNote] = useState(initialNote ?? "");

  return (
    <form action={action} className="flex items-center gap-2">
      <input
        name="note"
        type="text"
        placeholder="Комментарий к заказу"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="admin-form-input text-sm flex-1"
      />
      <FormButton color="blue" small>Сохранить</FormButton>
      {formState.success && (
        <span className="text-emerald-600 text-xs">{formState.success.message}</span>
      )}
    </form>
  );
}
