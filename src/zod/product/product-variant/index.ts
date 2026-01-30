import { z } from "zod";

export const createVariantSchema = z.object({
  variantName: z.string().min(1, { message: "Название варианта обязательно" }),
  productId: z.string().uuid({ message: "Неверный id товара" }),
});
