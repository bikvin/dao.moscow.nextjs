import { z } from "zod";
import { CurrencyEnum } from "@prisma/client";

export const expenseSchema = z.object({
  name: z.string().min(1, "Введите название"),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  currency: z.nativeEnum(CurrencyEnum, { message: "Выберите валюту" }),
  date: z.string().min(1, "Выберите дату"),
});

export const recurringExpenseSchema = z.object({
  name: z.string().min(1, "Введите название"),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  currency: z.nativeEnum(CurrencyEnum, { message: "Выберите валюту" }),
});

export type ExpenseFormState = {
  fieldErrors?: Partial<Record<keyof z.infer<typeof expenseSchema>, string[]>>;
  error?: string;
};

export type RecurringExpenseFormState = {
  fieldErrors?: Partial<Record<keyof z.infer<typeof recurringExpenseSchema>, string[]>>;
  error?: string;
};
