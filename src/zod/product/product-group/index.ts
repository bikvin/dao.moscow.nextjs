import { z } from "zod";

export const editProductGroupSchema = z.object({
  name: z.string().min(3, { message: "Минимум 3 символа" }),
  displayOrder: z.string().optional(),
  id: z.string().cuid({ message: "Неверный id" }),
});

export const createProductGroupSchema = z.object({
  name: z.string().min(3, { message: "Минимум 3 символа" }),
  displayOrder: z.string().optional(),
});
