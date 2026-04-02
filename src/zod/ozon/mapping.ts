import { z } from "zod";

const baseMappingSchema = z.object({
  productId: z.string().uuid({ message: "Выберите товар" }),
  ozonOfferId: z.string().min(1, "Укажите Offer ID на Ozon"),
  buffer: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable().optional()
  ),
  divisor: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1).nullable().optional()
  ),
  priceMarkup: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().nullable().optional()
  ),
});

export const createOzonMappingSchema = baseMappingSchema;

export const updateOzonMappingSchema = baseMappingSchema.extend({
  id: z.string().uuid("Неверный id"),
});
