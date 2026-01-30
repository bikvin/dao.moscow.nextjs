import { ProductStatusEnum } from "@prisma/client";
import { z } from "zod";

const baseProductSchema = z.object({
  sku: z.string().min(3, { message: "Минимум 3 символа" }),
  descriptionShort: z.string().optional(),
  descriptionLong: z.string().optional(),
  imageGroupName: z.string().uuid({ message: "Неверный id группы картинок" }),
  imagesArrString: z.string().min(1, { message: "Неверный массив файлов" }),
  status: z.nativeEnum(ProductStatusEnum, {
    errorMap: () => ({ message: "Неверный статус продукта" }),
  }),
  displayOrder: z.string().optional(),
  productGroupId: z.string().uuid({ message: "Выберите группу товаров" }),
});

export const createProductSchema = baseProductSchema;

export const editProductSchema = baseProductSchema.extend({
  id: z.string().uuid({ message: "Неверный id" }),
});
