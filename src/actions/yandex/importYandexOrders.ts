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
  count: number;                  // Yandex unit count (1 Yandex unit = divisor warehouse units)
  priceBeforeDiscount: number;    // listed retail price per Yandex unit — commission basis
  productId: string;
  variantId: string;
};

export type ImportOrder = {
  yandexOrderId: string;
  orderDate: string;
  mappedStatus: OrderStatusEnum;
  sellPrice: number;                  // buyerTotal + subsidyTotal — actual seller payout basis
  buyerTotal: number;                 // actual buyer payment — stored in YandexOrderData
  subsidyTotal: number;               // Yandex-funded discount — stored in YandexOrderData
  buyerTotalBeforeDiscount: number;   // sum of item.priceBeforeDiscount × count — commission basis
  deliveryCity: string | null;
  shipmentDate: string | null;      // DD-MM-YYYY — when Yandex expects warehouse handoff
  fees: CandidateFees;
  feesSettled: boolean;
  items: ImportOrderItem[];
};

// Imports selected Yandex orders into the database.
// For each order:
//   - Creates an Order record (source=YANDEX, next sequenceNumber in the year)
//   - Creates a YandexOrderData record with fee breakdown
//   - Creates OrderItem records for each mapped product, with quantity expanded by divisor
//     (1 Yandex unit = effectiveDivisor warehouse units) and price set to net per warehouse unit
//   - Creates ProductReserve (for active orders) or ProductIssue (for delivered orders)
//     and recalculates warehouse quantities — same logic as manual order creation
// All of the above runs in a single DB transaction per order.
export async function importYandexOrders(
  orders: ImportOrder[],
  partnerId: string
): Promise<{ imported: number } | { error: string }> {
  if (orders.length === 0) return { imported: 0 };

  try {
    // Load global settings and partner name once before processing orders
    const [partner, commissionRateSetting, avgDeliverySetting, globalDivisorSetting, paymentMethodIdSetting] =
      await Promise.all([
        db.partner.findUnique({
          where: { id: partnerId },
          include: {
            names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
          },
        }),
        db.settings.findUnique({ where: { field: "yandexCommissionRate" } }),
        db.settings.findUnique({ where: { field: "yandexAverageDeliveryRub" } }),
        db.settings.findUnique({ where: { field: "yandexDefaultDivisor" } }),
        db.settings.findUnique({ where: { field: "yandexPaymentMethodId" } }),
      ]);

    if (!partner) return { error: "Партнёр не найден" };
    const clientName = partner.names[0]?.name ?? "Яндекс Маркет";
    const commissionRate = commissionRateSetting ? parseFloat(commissionRateSetting.value) : 0;
    const avgDelivery = avgDeliverySetting ? parseFloat(avgDeliverySetting.value) : 0;
    const globalDivisor = globalDivisorSetting ? parseInt(globalDivisorSetting.value, 10) : 1;
    const marketplacePaymentMethodId = paymentMethodIdSetting?.value ?? null;

    // Look up per-SKU divisors from YandexMarketMapping and product dimensions for all items
    const allOfferIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.offerId)))];
    const allProductIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
    const [mappings, products] = await Promise.all([
      db.yandexMarketMapping.findMany({
        where: { yandexSku: { in: allOfferIds } },
        select: { yandexSku: true, divisor: true },
      }),
      db.product.findMany({
        where: { id: { in: allProductIds } },
        select: { id: true, length_mm: true, width_mm: true },
      }),
    ]);
    const divisorBySku = new Map(mappings.map((m) => [m.yandexSku, m.divisor]));
    const dimensionsById = new Map(products.map((p) => [p.id, p]));

    let importedCount = 0;

    for (const order of orders) {
      const orderDate = new Date(order.orderDate);
      const year = orderDate.getFullYear();
      const status = order.mappedStatus;
      const isShipped = status === OrderStatusEnum.SHIPPED;

      // Parse DD-MM-YYYY shipment date from Yandex into a JS Date
      const plannedDeliveryDate = (() => {
        if (!order.shipmentDate) return null;
        const [dd, mm, yyyy] = order.shipmentDate.split("-");
        if (!dd || !mm || !yyyy) return null;
        return new Date(`${yyyy}-${mm}-${dd}`);
      })();

      // Calculate per-order other fees (non-commission) for the net formula.
      // Settled: sum of actual API fees. Unsettled: avgDelivery × total Yandex units.
      const totalYandexUnits = order.items.reduce((s, i) => s + i.count, 0);
      const otherFees = order.feesSettled
        ? order.fees.deliveryRub + order.fees.expressDeliveryRub + order.fees.crossDeliveryRub +
          order.fees.paymentTransferRub + order.fees.agencyRub + order.fees.loyaltyFeeRub +
          order.fees.sortingRub
        : avgDelivery * totalYandexUnits;

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
            paymentStatus: PaymentStatusEnum.PAID,
            paymentMethodId: marketplacePaymentMethodId ?? undefined,
            // Use orderDate as delivery date for already-delivered orders (exact date not in API)
            deliveryDate: isShipped ? orderDate : null,
            plannedDeliveryDate: !isShipped ? plannedDeliveryDate : null,
            note: [
              `Заказ № ${order.yandexOrderId}`,
              order.deliveryCity,
              "(импортировано)",
            ].filter(Boolean).join(" "),
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

        // Create order items.
        // Net per Yandex unit = priceBeforeDiscount × (1 - rate) - otherFees / totalYandexUnits.
        // Each Yandex unit expands to effectiveDivisor warehouse units.
        // If product dimensions are available: price stored per m², priceUnit = M2.
        // Otherwise: price stored per warehouse unit, priceUnit = ITEM (fallback).
        let totalRub = 0;
        const variantQuantities = new Map<string, number>();

        for (const item of order.items) {
          const effectiveDivisor = divisorBySku.get(item.offerId) ?? globalDivisor;
          const itemNetPerYandexUnit =
            item.priceBeforeDiscount * (1 - commissionRate / 100) -
            otherFees / totalYandexUnits;
          const warehouseQty = item.count * effectiveDivisor;

          // m² area = length × width (in mm²) × quantity / 1_000_000
          const dims = dimensionsById.get(item.productId);
          const quantityM2 = dims
            ? (dims.length_mm * dims.width_mm * warehouseQty) / 1_000_000
            : null;

          let priceRubKopecks: number;
          let itemTotal: number;
          let priceUnit: PriceUnitEnum;

          if (dims && quantityM2) {
            // Price per m² = net per Yandex unit / (divisor × m²PerUnit)
            const m2PerYandexUnit = (dims.length_mm * dims.width_mm * effectiveDivisor) / 1_000_000;
            priceRubKopecks = Math.round((itemNetPerYandexUnit / m2PerYandexUnit) * 100);
            itemTotal = Math.round(quantityM2 * priceRubKopecks);
            priceUnit = PriceUnitEnum.M2;
          } else {
            // Fallback: price per warehouse unit
            priceRubKopecks = Math.round((itemNetPerYandexUnit / effectiveDivisor) * 100);
            itemTotal = warehouseQty * priceRubKopecks;
            priceUnit = PriceUnitEnum.ITEM;
          }

          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: item.productId,
              productVariantId: item.variantId,
              quantity: warehouseQty,
              quantityM2,
              priceUnit,
              priceInCents: priceRubKopecks,
              priceCurrency: CurrencyEnum.RUB,
              priceRub: priceRubKopecks,
              totalRub: itemTotal,
            },
          });

          totalRub += itemTotal;
          variantQuantities.set(
            item.variantId,
            (variantQuantities.get(item.variantId) ?? 0) + warehouseQty
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
