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
  ProductReserveStatusEnum,
} from "@prisma/client";
import { recalculateWarehouseQuantity } from "@/lib/product/recalculateWarehouseQuantity";
import type { OzonCandidateItem, OzonServiceFeesBreakdown } from "./fetchOzonOrderCandidates";

const RESERVE_STATUSES = new Set<OrderStatusEnum>([
  OrderStatusEnum.RESERVE,
  OrderStatusEnum.SHIPMENT_PLANNED,
  OrderStatusEnum.SELF_PICKUP,
]);

export type ImportOzonOrderItem = OzonCandidateItem & {
  productId: string;
  variantId: string;
};

export type ImportOzonOrder = {
  postingNumber: string;
  orderDate: string;         // ISO string
  mappedStatus: OrderStatusEnum;
  city: string | null;
  shipmentDate: string | null; // ISO string
  totalBuyerPrice: number;
  totalPayout: number;
  serviceFeesBreakdown: OzonServiceFeesBreakdown | null; // null = use avgServiceFeeRub estimate
  items: ImportOzonOrderItem[];
};

// Imports selected Ozon orders into the database.
// For each posting:
//   - Creates an Order record (source=OZON, next sequenceNumber in the year)
//   - Creates an OzonOrderData record with per-posting financial summary
//   - Creates OrderItem records with quantity expanded by divisor and net price per warehouse unit
//     Net = payout per Ozon unit - avgServiceFeeRub (estimate until transaction settles)
//   - Creates ProductReserve and recalculates warehouse quantities
// All of the above runs in a single DB transaction per posting.
export async function importOzonOrders(
  orders: ImportOzonOrder[],
  partnerId: string
): Promise<{ imported: number; orderIds: string[] } | { error: string }> {
  if (orders.length === 0) return { imported: 0, orderIds: [] };

  try {
    const [partner, avgServiceFeeSetting, globalDivisorSetting, paymentMethodIdSetting] =
      await Promise.all([
        db.partner.findUnique({
          where: { id: partnerId },
          include: {
            names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
          },
        }),
        db.settings.findUnique({ where: { field: "ozonAverageServiceFeeRub" } }),
        db.settings.findUnique({ where: { field: "ozonDefaultDivisor" } }),
        db.settings.findUnique({ where: { field: "ozonPaymentMethodId" } }),
      ]);

    if (!partner) return { error: "Партнёр не найден" };
    const clientName = partner.names[0]?.name ?? "Ozon";
    const avgServiceFee = avgServiceFeeSetting ? parseFloat(avgServiceFeeSetting.value) : 0;
    const globalDivisor = globalDivisorSetting ? parseInt(globalDivisorSetting.value, 10) : 1;
    const marketplacePaymentMethodId = paymentMethodIdSetting?.value ?? null;

    const allOfferIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.offerId)))];
    const [mappings, products] = await Promise.all([
      db.ozonMapping.findMany({
        where: { ozonOfferId: { in: allOfferIds } },
        select: { ozonOfferId: true, divisor: true },
      }),
      db.product.findMany({
        where: { sku: { in: allOfferIds } },
        select: { id: true, sku: true, length_mm: true, width_mm: true },
      }),
    ]);
    const divisorBySku = new Map(mappings.map((m) => [m.ozonOfferId, m.divisor]));
    const dimensionsById = new Map(products.map((p) => [p.id, p]));
    const productBySku = new Map(products.map((p) => [p.sku, p]));

    let importedCount = 0;
    const orderIds: string[] = [];

    for (const order of orders) {
      const orderDate = new Date(order.orderDate);
      const year = orderDate.getFullYear();
      const status = order.mappedStatus;

      const plannedDeliveryDate = order.shipmentDate ? new Date(order.shipmentDate) : null;
      const totalOzonUnits = order.items.reduce((s, i) => s + i.quantity, 0);
      const effectiveServiceFees = order.serviceFeesBreakdown?.total ?? (avgServiceFee * totalOzonUnits);
      const feesSettledOnImport = order.serviceFeesBreakdown !== null;

      const { orderId } = await db.$transaction(async (tx) => {
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
            source: OrderSourceEnum.OZON,
            partnerId,
            paymentStatus: PaymentStatusEnum.PAID,
            paymentMethodId: marketplacePaymentMethodId ?? undefined,
            plannedDeliveryDate,
            note: [
              `Заказ Ozon № ${order.postingNumber}`,
              order.city,
              "(импортировано)",
            ].filter(Boolean).join(" "),
            totalRub: 0,
          },
        });

        await tx.ozonOrderData.create({
          data: {
            postingNumber: order.postingNumber,
            buyerPrice: order.totalBuyerPrice,
            commissionAmount: order.items.reduce((s, i) => s + i.commissionAmount, 0),
            payoutAmount: order.totalPayout,
            feesSettled: feesSettledOnImport,
            logisticsRub: order.serviceFeesBreakdown?.logisticsRub ?? 0,
            dropoffRub: order.serviceFeesBreakdown?.dropoffRub ?? 0,
            lastMileRub: order.serviceFeesBreakdown?.lastMileRub ?? 0,
            starsMembershipRub: order.serviceFeesBreakdown?.starsMembershipRub ?? 0,
            acquiringRub: order.serviceFeesBreakdown?.acquiringRub ?? 0,
            orderId: created.id,
          },
        });

        // Net per Ozon unit = payout - avgServiceFee (estimate; replaced on settlement)
        let totalRub = 0;
        const variantQuantities = new Map<string, number>();

        for (const item of order.items) {
          const product = productBySku.get(item.offerId);
          if (!product) continue;

          const effectiveDivisor = divisorBySku.get(item.offerId) ?? globalDivisor;
          // payout is per-item total from financial_data; 0 means financial_data not yet available.
          // Use 0 net as placeholder — recalculation will update once transactions arrive.
          const payoutPerOzonUnit = item.payout > 0 ? item.payout / item.quantity : 0;
          const netPerOzonUnit = payoutPerOzonUnit > 0
            ? payoutPerOzonUnit - effectiveServiceFees / totalOzonUnits
            : 0;
          const warehouseQty = item.quantity * effectiveDivisor;

          const dims = dimensionsById.get(product.id);
          const quantityM2 = dims
            ? (dims.length_mm * dims.width_mm * warehouseQty) / 1_000_000
            : null;

          let priceRubKopecks: number;
          let itemTotal: number;
          let priceUnit: PriceUnitEnum;

          if (dims && quantityM2) {
            const m2PerOzonUnit = (dims.length_mm * dims.width_mm * effectiveDivisor) / 1_000_000;
            priceRubKopecks = Math.round((netPerOzonUnit / m2PerOzonUnit) * 100);
            itemTotal = Math.round(quantityM2 * priceRubKopecks);
            priceUnit = PriceUnitEnum.M2;
          } else {
            priceRubKopecks = Math.round((netPerOzonUnit / effectiveDivisor) * 100);
            itemTotal = warehouseQty * priceRubKopecks;
            priceUnit = PriceUnitEnum.ITEM;
          }

          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: product.id,
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

        const orderLabel = `Ozon заказ #${order.postingNumber}`;
        if (RESERVE_STATUSES.has(status)) {
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
        // CANCELLED orders: no reserve created

        return { orderId: created.id };
      });

      orderIds.push(orderId);
      importedCount++;
    }

    revalidatePath("/admin");
    return { imported: importedCount, orderIds };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка при импорте" };
  }
}
