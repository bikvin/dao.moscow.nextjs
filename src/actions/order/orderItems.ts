"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { PriceUnitEnum, CurrencyEnum } from "@prisma/client";
import { z } from "zod";

const addOrderItemSchema = z.object({
  productId: z.string().min(1, "Выберите товар"),
  productVariantId: z.string().min(1, "Выберите партию"),
  quantity: z.coerce.number().int().positive("Введите количество"),
  priceUnit: z.nativeEnum(PriceUnitEnum),
  price: z.coerce.number().positive("Введите цену"),
  priceCurrency: z.nativeEnum(CurrencyEnum),
  priceRub: z.coerce.number().positive("Введите цену в рублях"),
});

export async function addOrderItem(
  orderId: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = addOrderItemSchema.safeParse({
    productId: formData.get("productId"),
    productVariantId: formData.get("productVariantId"),
    quantity: formData.get("quantity"),
    priceUnit: formData.get("priceUnit"),
    price: formData.get("price"),
    priceCurrency: formData.get("priceCurrency"),
    priceRub: formData.get("priceRub"),
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  const quantityM2Str = formData.get("quantityM2") as string;
  const quantityM2 = quantityM2Str ? parseFloat(quantityM2Str) : null;

  const priceInCents = Math.round(result.data.price * 100);
  const priceRubKopecks = Math.round(result.data.priceRub * 100);

  const itemTotalStr = formData.get("itemTotal") as string;
  const totalRub = itemTotalStr
    ? Math.round((parseFloat(itemTotalStr) || 0) * 100)
    : result.data.priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
      ? Math.round(quantityM2 * priceRubKopecks)
      : result.data.quantity * priceRubKopecks;

  try {
    await db.$transaction(async (tx) => {
      await tx.orderItem.create({
        data: {
          orderId,
          productId: result.data.productId,
          productVariantId: result.data.productVariantId,
          quantity: result.data.quantity,
          quantityM2,
          priceUnit: result.data.priceUnit,
          priceInCents,
          priceCurrency: result.data.priceCurrency,
          priceRub: priceRubKopecks,
          totalRub,
        },
      });

      const [allItems, order] = await Promise.all([
        tx.orderItem.findMany({ where: { orderId } }),
        tx.order.findUnique({
          where: { id: orderId },
          select: { deliveryPriceRub: true, discountPercent: true },
        }),
      ]);

      if (!order) throw new Error("Заказ не найден");

      const subtotal = allItems.reduce((s, i) => s + i.totalRub, 0) + order.deliveryPriceRub;
      const newTotal = Math.round(subtotal * (1 - order.discountPercent / 100));

      await tx.order.update({ where: { id: orderId }, data: { totalRub: newTotal } });
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin");
  return { success: { message: "Добавлено" } };
}
