"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import {
  OrderStatusEnum,
  OrderSourceEnum,
  OrderTypeEnum,
  CurrencyEnum,
  PriceUnitEnum,
  PaymentStatusEnum,
  ProductIssueEnum,
  ProductReserveStatusEnum,
} from "@prisma/client";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import type { CandidateFees } from "./fetchOrderCandidates";

// Statuses that require a ProductReserve to be created (stock is reserved but not yet shipped)
const RESERVE_STATUSES = new Set<OrderStatusEnum>([
  OrderStatusEnum.RESERVE,
  OrderStatusEnum.SHIPMENT_PLANNED,
  OrderStatusEnum.SELF_PICKUP,
]);

export type ImportOrderItem = {
  offerId: string;
  count: number;
  priceRub: number;  // per item in rubles
  productId: string;
  variantId: string;
};

export type ImportOrder = {
  yandexOrderId: string;
  orderDate: string;
  mappedStatus: OrderStatusEnum;
  sellPrice: number;    // buyerTotal + subsidyTotal — actual seller payout basis, stored as Order.totalRub (×100 kopecks)
  buyerTotal: number;   // actual buyer payment in rubles — stored in YandexOrderData
  subsidyTotal: number; // Yandex-funded discount reimbursed to seller — stored in YandexOrderData
  fees: CandidateFees;
  feesSettled: boolean;
  items: ImportOrderItem[];
};

// Imports selected Yandex orders into the database.
// For each order:
//   - Creates an Order record (source=YANDEX, next sequenceNumber in the year)
//   - Creates a YandexOrderData record with fee breakdown
//   - Creates OrderItem records for each mapped product
//   - Creates ProductReserve (for active orders) or ProductIssue (for delivered orders)
//     and recalculates warehouse quantities — same logic as manual order creation
// All of the above runs in a single DB transaction per order.
export async function importYandexOrders(
  orders: ImportOrder[],
  partnerId: string
): Promise<{ imported: number } | { error: string }> {
  if (orders.length === 0) return { imported: 0 };

  try {
    // Look up partner name once — used as the "client" label on reserves
    const partner = await db.partner.findUnique({
      where: { id: partnerId },
      include: {
        names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
      },
    });
    if (!partner) return { error: "Партнёр не найден" };
    const clientName = partner.names[0]?.name ?? "Яндекс Маркет";

    let importedCount = 0;

    for (const order of orders) {
      const orderDate = new Date(order.orderDate);
      const year = orderDate.getFullYear();
      const status = order.mappedStatus;
      const isShipped = status === OrderStatusEnum.SHIPPED;

      await db.$transaction(async (tx) => {
        // Auto-assign next sequenceNumber for the year (same as manual order creation)
        const last = await tx.order.findFirst({
          where: { year },
          orderBy: { sequenceNumber: "desc" },
          select: { sequenceNumber: true },
        });
        const sequenceNumber = (last?.sequenceNumber ?? 0) + 1;

        const created = await tx.order.create({
          data: {
            year,
            sequenceNumber,
            orderDate,
            orderType: OrderTypeEnum.SALE,
            status,
            source: OrderSourceEnum.YANDEX,
            partnerId,
            // Delivered orders are considered paid; active orders are pending Yandex payout
            paymentStatus: isShipped ? PaymentStatusEnum.PAID : PaymentStatusEnum.NOT_PAID,
            // Use orderDate as delivery date for already-delivered orders (exact date not in API)
            deliveryDate: isShipped ? orderDate : null,
            totalRub: 0, // updated below after items are created
          },
        });

        // Store Yandex-specific financial data separately (1-to-1 with Order)
        await tx.yandexOrderData.create({
          data: {
            yandexOrderId: order.yandexOrderId,
            buyerTotal: order.buyerTotal,
            subsidyTotal: order.subsidyTotal,
            feeRub: order.fees.feeRub,
            deliveryRub: order.fees.deliveryRub,
            expressDeliveryRub: order.fees.expressDeliveryRub,
            crossDeliveryRub: order.fees.crossDeliveryRub,
            paymentTransferRub: order.fees.paymentTransferRub,
            agencyRub: order.fees.agencyRub,
            loyaltyFeeRub: order.fees.loyaltyFeeRub,
            sortingRub: order.fees.sortingRub,
            feesSettled: order.feesSettled,
            orderId: created.id,
          },
        });

        // Create order items and accumulate total.
        // Prices stored in kopecks (×100) to match the existing order model convention.
        let totalRub = 0;
        const variantQuantities = new Map<string, number>();

        for (const item of order.items) {
          const priceRubKopecks = Math.round(item.priceRub * 100);
          const itemTotal = item.count * priceRubKopecks;

          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: item.productId,
              productVariantId: item.variantId,
              quantity: item.count,
              priceUnit: PriceUnitEnum.ITEM, // sold per package, not per m²
              priceInCents: priceRubKopecks,
              priceCurrency: CurrencyEnum.RUB,
              priceRub: priceRubKopecks,
              totalRub: itemTotal,
            },
          });

          totalRub += itemTotal;
          variantQuantities.set(
            item.variantId,
            (variantQuantities.get(item.variantId) ?? 0) + item.count
          );
        }

        await tx.order.update({ where: { id: created.id }, data: { totalRub } });

        const orderLabel = `Яндекс заказ #${order.yandexOrderId}`;

        if (isShipped) {
          // Order already delivered — write issues immediately, no reserve needed
          for (const [variantId, qty] of variantQuantities) {
            await tx.productIssue.create({
              data: {
                productVariantId: variantId,
                orderId: created.id,
                quantity: qty,
                issueDate: orderDate,
                type: ProductIssueEnum.SALE,
                description: orderLabel,
              },
            });
            await recalculateWarehouseQuantity(variantId, tx);
          }
        } else if (RESERVE_STATUSES.has(status)) {
          // Order in progress — reserve stock until manager marks as shipped
          for (const [variantId, qty] of variantQuantities) {
            await tx.productReserve.create({
              data: {
                productVariantId: variantId,
                orderId: created.id,
                quantity: qty,
                reserveDate: orderDate,
                client: clientName,
                status: ProductReserveStatusEnum.ACTIVE,
              },
            });
            await recalculateWarehouseQuantity(variantId, tx);
          }
        }
        // CANCELLED orders: no reserve or issue created
      });

      importedCount++;
    }

    revalidatePath("/admin");
    return { imported: importedCount };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при импорте" };
  }
}
