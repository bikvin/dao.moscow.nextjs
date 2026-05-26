"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { SubItemFormState } from "@/actions/partner/PartnerFormState";
import { OrderTypeEnum, OrderStatusEnum, PriceUnitEnum, CurrencyEnum, PaymentStatusEnum, ProductReserveStatusEnum, ProductIssueEnum, ProductReceiptTypeEnum } from "@prisma/client";
import { z } from "zod";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";

const RESERVE_STATUSES = new Set<OrderStatusEnum>([OrderStatusEnum.RESERVE, OrderStatusEnum.SHIPMENT_PLANNED, OrderStatusEnum.SELF_PICKUP]);

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
  const itemTotals = formData.getAll("itemTotal") as string[];

  try {
    await db.$transaction(async (tx) => {
      // Read current order to detect status transition
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true, year: true, sequenceNumber: true },
      });
      const becomingShipped =
        status === OrderStatusEnum.SHIPPED &&
        currentOrder?.status !== OrderStatusEnum.SHIPPED;
      const wasShipped =
        currentOrder?.status === OrderStatusEnum.SHIPPED &&
        status !== OrderStatusEnum.SHIPPED;

      // If reverting from SHIPPED: delete linked issues/receipts and collect their variant IDs
      const revertVariantIds = new Set<string>();
      if (wasShipped) {
        const [existingIssues, existingReceipts] = await Promise.all([
          tx.productIssue.findMany({ where: { orderId }, select: { productVariantId: true } }),
          tx.productReceipt.findMany({ where: { orderId }, select: { productVariantId: true } }),
        ]);
        existingIssues.forEach((i) => revertVariantIds.add(i.productVariantId));
        existingReceipts.forEach((r) => revertVariantIds.add(r.productVariantId));
        await tx.productIssue.deleteMany({ where: { orderId } });
        await tx.productReceipt.deleteMany({ where: { orderId } });
      }

      // Collect ACTIVE reserves before any changes
      const activeReserves = await tx.productReserve.findMany({
        where: { orderId, status: ProductReserveStatusEnum.ACTIVE },
      });
      const oldVariantIds = new Set(activeReserves.map((r) => r.productVariantId));

      // For non-shipped transitions: wipe all order reserves so they get recreated
      if (!becomingShipped) {
        await tx.productReserve.deleteMany({ where: { orderId } });
      }

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
          paymentDate,
          paymentStatus,
        },
      });

      await tx.orderItem.deleteMany({ where: { orderId } });

      let totalRub = 0;
      const variantQuantities = new Map<string, number>();

      for (let i = 0; i < productIds.length; i++) {
        if (!productIds[i] || !variantIds[i]) continue;
        const qty = parseInt(quantities[i]) || 0;
        if (qty <= 0) continue;

        const priceUnit = priceUnits[i] as PriceUnitEnum;
        const priceInCents = Math.round((parseFloat(prices[i]) || 0) * 100);
        const priceRubKopecks = Math.round((parseFloat(priceRubs[i]) || 0) * 100);
        const quantityM2 = quantityM2s[i] ? parseFloat(quantityM2s[i]) : null;

        const itemTotal = itemTotals[i]
          ? Math.round((parseFloat(itemTotals[i]) || 0) * 100)
          : priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
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
        variantQuantities.set(variantIds[i], (variantQuantities.get(variantIds[i]) ?? 0) + qty);
      }

      const grandTotal = Math.round(totalRub * (1 - discountPercent / 100)) + deliveryPriceRub;
      await tx.order.update({ where: { id: orderId }, data: { totalRub: grandTotal } });

      const orderLabel = `Заказ №${currentOrder?.sequenceNumber}/${currentOrder?.year}`;
      const eventDate = deliveryDate ?? orderDate;

      if (becomingShipped) {
        if (result.data.orderType === OrderTypeEnum.SALE) {
          // Fulfill existing active reserves and create issues for them
          const fulfilledVariants = new Set<string>();
          for (const reserve of activeReserves) {
            await tx.productReserve.update({
              where: { id: reserve.id },
              data: { status: ProductReserveStatusEnum.FULFILLED },
            });
            await tx.productIssue.create({
              data: {
                productVariantId: reserve.productVariantId,
                orderId,
                quantity: reserve.quantity,
                issueDate: eventDate,
                type: ProductIssueEnum.SALE,
                description: orderLabel,
              },
            });
            fulfilledVariants.add(reserve.productVariantId);
          }
          // Create issues for items not covered by a reserve (edge case)
          for (const [variantId, qty] of variantQuantities) {
            if (!fulfilledVariants.has(variantId)) {
              await tx.productIssue.create({
                data: {
                  productVariantId: variantId,
                  orderId,
                  quantity: qty,
                  issueDate: eventDate,
                  type: ProductIssueEnum.SALE,
                  description: orderLabel,
                },
              });
            }
          }
        } else if (result.data.orderType === OrderTypeEnum.RETURN) {
          for (const [variantId, qty] of variantQuantities) {
            await tx.productReceipt.create({
              data: {
                productVariantId: variantId,
                orderId,
                quantity: qty,
                receiptDate: eventDate,
                type: ProductReceiptTypeEnum.RETURN,
                description: orderLabel,
              },
            });
          }
        }

        for (const variantId of variantQuantities.keys()) {
          await recalculateWarehouseQuantity(variantId, tx);
        }
      } else {
        // Non-shipped: recreate reserves if needed
        const newVariantIds = new Set<string>();
        if (result.data.orderType === OrderTypeEnum.SALE && RESERVE_STATUSES.has(status)) {
          const partner = await tx.partner.findUnique({
            where: { id: result.data.partnerId },
            include: { names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 } },
          });
          const clientName = partner?.names[0]?.name ?? "—";

          for (const [variantId, qty] of variantQuantities) {
            await tx.productReserve.create({
              data: {
                productVariantId: variantId,
                orderId,
                quantity: qty,
                reserveDate: orderDate,
                client: clientName,
                status: ProductReserveStatusEnum.ACTIVE,
              },
            });
            newVariantIds.add(variantId);
          }
        }

        const allVariantIds = new Set([...oldVariantIds, ...newVariantIds, ...revertVariantIds]);
        for (const variantId of allVariantIds) {
          await recalculateWarehouseQuantity(variantId, tx);
        }
      }
    });
  } catch (err: unknown) {
    return { errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] } };
  }

  revalidatePath("/admin");
  return { success: { message: "Заказ обновлён" } };
}
