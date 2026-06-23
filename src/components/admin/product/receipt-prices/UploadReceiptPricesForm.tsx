"use client";

import { useFormState } from "react-dom";
import { useRef } from "react";
import { uploadReceiptPrices, type UploadReceiptPricesState } from "@/actions/product/receipt-prices/uploadReceiptPrices";
import FormButton from "@/components/common/formButton/formButton";

// Upload form for the receipt-prices bulk update page.
export function UploadReceiptPricesForm() {
  const [state, action] = useFormState<UploadReceiptPricesState, FormData>(uploadReceiptPrices, {});
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600 font-medium">Загрузить заполненный файл</label>
        <input
          ref={fileRef}
          name="file"
          type="file"
          accept=".xlsx,.xls"
          className="admin-form-input text-sm"
        />
      </div>

      <div>
        <FormButton color="blue">Применить цены</FormButton>
      </div>

      {state.errors?._form && (
        <p className="text-red-600 text-sm">{state.errors._form.join(", ")}</p>
      )}
      {state.success && (
        <p className="text-emerald-700 text-sm font-medium">{state.success.message}</p>
      )}
    </form>
  );
}
