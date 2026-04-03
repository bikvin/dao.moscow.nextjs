"use client";

import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";
import { removeOzonPromotionsAction } from "@/actions/ozon/removePromotions";

export function OzonRemovePromotionsButton() {
  const [formState, action] = useFormState(removeOzonPromotionsAction, { errors: {} });

  return (
    <form action={action} className="inline-block">
      <FormButton color="red" small>
        Убрать из акций
      </FormButton>
      {formState.errors?._form && (
        <div className="text-red-600 text-sm mt-1">
          {formState.errors._form.join(", ")}
        </div>
      )}
      {formState.success && (
        <div className="text-emerald-600 text-sm mt-1">
          {formState.success.message}
        </div>
      )}
    </form>
  );
}
