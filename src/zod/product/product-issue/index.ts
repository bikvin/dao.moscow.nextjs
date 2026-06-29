import { ProductIssueEnum, CurrencyEnum, PriceUnitEnum } from "@prisma/client";
import { z } from "zod";

const baseProductIssueSchema = z.object({
  productVariantId: z
    .string()
    .uuid({ message: "Неверный id варианта продукта" }),
  quantity: z.coerce.number().int().min(1, "Укажите количество"),
  issueDate: z
    .string()
    .min(1, "Укажите дату")
    .pipe(
      z.coerce.date({
        invalid_type_error: "Неверный формат даты",
      })
    ),
  type: z.nativeEnum(ProductIssueEnum, {
    errorMap: () => ({ message: "Неверный тип списания" }),
  }),
  description: z.string().optional(),
  costPrice: z.coerce
    .number({ invalid_type_error: "Неверная цена" })
    .min(0, "Цена не может быть отрицательной")
    .optional(),
  costPriceCurrency: z.nativeEnum(CurrencyEnum).optional(),
  costPriceUnit: z.nativeEnum(PriceUnitEnum).optional(),
});

export const createProductIssueSchema = baseProductIssueSchema;

export const updateProductIssueSchema = baseProductIssueSchema.extend({
  id: z
    .string({
      required_error: "Укажите id",
      invalid_type_error: "Неверный id",
    })
    .uuid("Неверный id"),
});
