import { z } from "zod";

const baseProductGroupSchema = z.object({
  name: z.string().min(3, { message: "Минимум 3 символа" }),
  displayOrder: z.string().optional(),
});

export const createProductGroupSchema = baseProductGroupSchema;

export const editProductGroupSchema = baseProductGroupSchema.extend({
  id: z.string().uuid({ message: "Неверный id" }),
});
