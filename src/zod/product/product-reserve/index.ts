import { ProductReserveStatusEnum } from "@prisma/client";
import { z } from "zod";

const baseProductReserveSchema = z.object({
  productVariantId: z
    .string()
    .uuid({ message: "Неверный id варианта продукта" }),
  quantity: z.coerce.number().int().min(1, "Укажите количество"),
  reserveDate: z
    .string()
    .min(1, "Укажите дату")
    .pipe(
      z.coerce.date({
        invalid_type_error: "Неверный формат даты",
      })
    ),
  client: z.string().min(1, "Укажите клиента"),
  status: z.nativeEnum(ProductReserveStatusEnum, {
    errorMap: () => ({ message: "Неверный статус резерва" }),
  }),
});

export const createProductReserveSchema = baseProductReserveSchema;

export const updateProductReserveSchema = baseProductReserveSchema.extend({
  id: z
    .string({
      required_error: "Укажите id",
      invalid_type_error: "Неверный id",
    })
    .uuid("Неверный id"),
});
