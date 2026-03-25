import { z } from "zod";

const baseChipSizeSchema = z.object({
  name: z.string().min(1, { message: "Укажите название" }),
  displayOrder: z.string().optional(),
});

export const createChipSizeSchema = baseChipSizeSchema;

export const editChipSizeSchema = baseChipSizeSchema.extend({
  id: z.string().uuid({ message: "Неверный id" }),
});
