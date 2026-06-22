import { CurrencyEnum, PriceUnitEnum, ProductReceiptTypeEnum } from "@prisma/client";
import { z } from "zod";

const baseProductReceiptSchema = z.object({
  productVariantId: z
    .string()
    .uuid({ message: "Неверный id варианта продукта" }),
  quantity: z.coerce.number().int().min(1, "Укажите количество"),
  receiptDate: z
    .string()
    .min(1, "Укажите дату")
    .pipe(
      z.coerce.date({
        invalid_type_error: "Неверный формат даты",
      })
    ),
  type: z.nativeEnum(ProductReceiptTypeEnum, {
    errorMap: () => ({ message: "Неверный тип поставки" }),
  }),
  description: z.string().optional(),
  price: z.coerce.number().positive("Цена должна быть больше 0").optional().or(z.literal("")),
  priceCurrency: z.nativeEnum(CurrencyEnum).optional(),
  priceUnit: z.nativeEnum(PriceUnitEnum).optional(),
});

export const createProductReceiptSchema = baseProductReceiptSchema;

export const updateProductReceiptSchema = baseProductReceiptSchema.extend({
  id: z
    .string({
      required_error: "Укажите id",
      invalid_type_error: "Неверный id",
    })
    .uuid("Неверный id"),
});
