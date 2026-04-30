"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { OrderTypeEnum, OrderStatusEnum, PriceUnitEnum, CurrencyEnum, DeliveryStatusEnum, PaymentStatusEnum } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  partnerId: z.string().min(1, "Выберите партнёра"),
  orderDate: z.string().min(1, "Введите дату"),
  orderType: z.nativeEnum(OrderTypeEnum),
});

export async function updateOrder(
  orderId: string,
  _formState: SubItemFormState,
  formData: FormData
): Promise<SubItemFormState> {
  const result = schema.safeParse({
    partnerId: formData.get("partnerId"),
    orderDate: formData.get("orderDate"),
    orderType: formData.get("orderType"),
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  const orderDate = new Date(result.data.orderDate);
  if (isNaN(orderDate.getTime())) {
    return { errors: { _form: ["Неверная дата"] } };
  }

  const deliveryMethodId = (formData.get("deliveryMethodId") as string) || null;
  const paymentMethodId = (formData.get("paymentMethodId") as string) || null;
  const deliveryPriceRub = Math.round((parseFloat(formData.get("deliveryPrice") as string) || 0) * 100);
  const discountPercent = parseFloat(formData.get("discountPercent") as string) || 0;
  const note = (formData.get("note") as string) || null;
  const plannedDeliveryDateRaw = formData.get("plannedDeliveryDate") as string;
  const deliveryDateRaw = formData.get("deliveryDate") as string;
  const paymentDateRaw = formData.get("paymentDate") as string;
  const plannedDeliveryDate = plannedDeliveryDateRaw ? new Date(plannedDeliveryDateRaw) : null;
  const deliveryDate = deliveryDateRaw ? new Date(deliveryDateRaw) : null;
  const paymentDate = paymentDateRaw ? new Date(paymentDateRaw) : null;
  const deliveryStatus = (formData.get("deliveryStatus") as DeliveryStatusEnum) || DeliveryStatusEnum.NOT_DELIVERED;
  const paymentStatus = (formData.get("paymentStatus") as PaymentStatusEnum) || PaymentStatusEnum.NOT_PAID;
  const status = (formData.get("orderStatus") as OrderStatusEnum) || OrderStatusEnum.RESERVE;

  const productIds = formData.getAll("productId") as string[];
  const variantIds = formData.getAll("productVariantId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const priceUnits = formData.getAll("priceUnit") as string[];
  const prices = formData.getAll("price") as string[];
  const currencies = formData.getAll("priceCurrency") as string[];
  const priceRubs = formData.getAll("priceRub") as string[];
  const quantityM2s = formData.getAll("quantityM2") as string[];

  try {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderDate,
          orderType: result.data.orderType,
          status,
          partnerId: result.data.partnerId,
          deliveryMethodId,
          paymentMethodId,
          deliveryPriceRub,
          discountPercent,
          note,
          plannedDeliveryDate,
          deliveryDate,
          deliveryStatus,
          paymentDate,
          paymentStatus,
        },
      });

      await tx.orderItem.deleteMany({ where: { orderId } });

      let totalRub = 0;

      for (let i = 0; i < productIds.length; i++) {
        if (!productIds[i] || !variantIds[i]) continue;
        const qty = parseInt(quantities[i]) || 0;
        if (qty <= 0) continue;

        const priceUnit = priceUnits[i] as PriceUnitEnum;
        const priceInCents = Math.round((parseFloat(prices[i]) || 0) * 100);
        const priceRubKopecks = Math.round((parseFloat(priceRubs[i]) || 0) * 100);
        const quantityM2 = quantityM2s[i] ? parseFloat(quantityM2s[i]) : null;

        const itemTotal =
          priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
            ? Math.round(quantityM2 * priceRubKopecks)
            : qty * priceRubKopecks;

        await tx.orderItem.create({
          data: {
            orderId,
            productId: productIds[i],
            productVariantId: variantIds[i],
            quantity: qty,
            quantityM2,
            priceUnit,
            priceInCents,
            priceCurrency: currencies[i] as CurrencyEnum,
            priceRub: priceRubKopecks,
            totalRub: itemTotal,
          },
        });

        totalRub += itemTotal;
      }

      const grandTotal = Math.round(totalRub * (1 - discountPercent / 100)) + deliveryPriceRub;
      await tx.order.update({ where: { id: orderId }, data: { totalRub: grandTotal } });
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin");
  return { success: { message: "Заказ обновлён" } };
}
