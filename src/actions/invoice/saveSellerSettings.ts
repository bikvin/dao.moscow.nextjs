"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export interface SellerSettingsFormState {
  errors?: { _form?: string[] };
  success?: { message: string };
}

const SELLER_FIELDS = [
  "sellerLegalName",
  "sellerInn",
  "sellerKpp",
  "sellerAddress",
  "sellerPhone",
  "sellerBankName",
  "sellerShortBankName",
  "sellerBik",
  "sellerBankAccNo",
  "sellerAccNo",
] as const;

export async function saveSellerSettings(
  _formState: SellerSettingsFormState,
  formData: FormData
): Promise<SellerSettingsFormState> {
  try {
    await Promise.all(
      SELLER_FIELDS.map((field) => {
        const value = (formData.get(field) as string) ?? "";
        return db.settings.upsert({
          where: { field },
          update: { value },
          create: { field, value },
        });
      })
    );
  } catch (err: unknown) {
    return {
      errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] },
    };
  }

  revalidatePath("/admin/invoices/settings");
  return { success: { message: "Сохранено" } };
}
