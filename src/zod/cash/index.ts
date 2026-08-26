import { z } from "zod";
import { CurrencyEnum, CashFlowType } from "@prisma/client";

export const cashTransactionSchema = z.object({
  date: z.string().min(1, "Выберите дату"),
  type: z.nativeEnum(CashFlowType, { message: "Выберите тип операции" }),
  currency: z.nativeEnum(CurrencyEnum, { message: "Выберите валюту" }),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  description: z.string().min(1, "Введите описание"),
});

export type CashTransactionFormState = {
  fieldErrors?: Partial<Record<keyof z.infer<typeof cashTransactionSchema>, string[]>>;
  error?: string;
};
