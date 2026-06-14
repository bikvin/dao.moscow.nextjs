"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { debugOzonReturnsAction } from "@/actions/ozon/debugOzonReturnsAction";

// Triggers a server-side fetch of recent Ozon FBS returns and logs the raw response
// to the server console. Used to discover the API response shape.
export function OzonDebugReturnsButton() {
  const [formState, action] = useFormState(debugOzonReturnsAction, {});

  return (
    <form action={action} className="flex items-center gap-3 flex-wrap">
      <FormButton color="green" small>Показать возвраты в консоли</FormButton>
      {formState.errors?._form && (
        <span className="text-red-600 text-sm">{formState.errors._form.join(", ")}</span>
      )}
      {formState.success && (
        <span className="text-emerald-600 text-sm">{formState.success.message}</span>
      )}
    </form>
  );
}
