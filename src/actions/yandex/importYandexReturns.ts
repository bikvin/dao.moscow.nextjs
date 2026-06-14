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
} from "@prisma/client";

export type ImportYandexReturnItem = {
  shopSku: string;
  count: number;              // Yandex units returned
  priceBeforeDiscount: number;
  productId: string;
  variantId: string;
};

export type ImportYandexReturn = {
  yandexReturnId: string;
  yandexOrderId: string;
  returnType: string;
  refundStatus: string | null;
  shipmentStatus: string | null;
  buyerRefundRub: number;
  sellerImpactRub: number;    // positive absolute value
  creationDate: string | null;
  items: ImportYandexReturnItem[];
};

// Imports selected Yandex returns into the database.
// For each return:
//   - Creates an Order (orderType=RETURN, source=YANDEX, totalRub=positive sellerImpactRub)
//   - Creates OrderItem records with positive net per warehouse unit (same as manual returns)
//     Net per Yandex unit = priceBeforeDiscount × (1-rate); expanded by divisor to warehouse units
//   - Creates a YandexReturnData record with return metadata
// Minus signs are shown in the UI because orderType=RETURN, not from stored negative values.
export async function importYandexReturns(
  returns: ImportYandexReturn[],
  partnerId: string
): Promise<{ imported: number; orderIds: string[] } | { error: string }> {
  if (returns.length === 0) return { imported: 0, orderIds: [] };

  try {
    const [partner, commissionRateSetting, globalDivisorSetting, paymentMethodIdSetting] =
      await Promise.all([
        db.partner.findUnique({
          where: { id: partnerId },
          include: { names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 } },
        }),
        db.settings.findUnique({ where: { field: "yandexCommissionRate" } }),
        db.settings.findUnique({ where: { field: "yandexDefaultDivisor" } }),
        db.settings.findUnique({ where: { field: "yandexPaymentMethodId" } }),
      ]);

    if (!partner) return { error: "Партнёр не найден" };
    const commissionRate = commissionRateSetting ? parseFloat(commissionRateSetting.value) : 0;
    const globalDivisor = globalDivisorSetting ? parseInt(globalDivisorSetting.value, 10) : 1;
    const marketplacePaymentMethodId = paymentMethodIdSetting?.value ?? null;

    const allProductIds = [
      ...new Set(returns.flatMap((r) => r.items.map((i) => i.productId))),
    ];
    const allOfferIds = [
      ...new Set(returns.flatMap((r) => r.items.map((i) => i.shopSku))),
    ];

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
    const orderIds: string[] = [];

    for (const ret of returns) {
      const returnDate = ret.creationDate ? new Date(ret.creationDate) : new Date();
      const year = returnDate.getFullYear();

      const { orderId } = await db.$transaction(async (tx) => {
        const last = await tx.order.findFirst({
          where: { year },
          orderBy: { sequenceNumber: "desc" },
          select: { sequenceNumber: true },
        });
        const sequenceNumber = (last?.sequenceNumber ?? 0) + 1;

        const typeLabel = ret.returnType === "UNREDEEMED" ? "не выкуплен" : "возврат";
        const created = await tx.order.create({
          data: {
            year,
            sequenceNumber,
            orderDate: returnDate,
            orderType: OrderTypeEnum.RETURN,
            status: OrderStatusEnum.RESERVE,
            source: OrderSourceEnum.YANDEX,
            partnerId,
            paymentStatus: PaymentStatusEnum.PAID,
            paymentMethodId: marketplacePaymentMethodId ?? undefined,
            note: `Возврат Яндекс #${ret.yandexReturnId} (заказ #${ret.yandexOrderId}) ${typeLabel} (импортировано)`,
            totalRub: 0, // updated after items
          },
        });

        // Create OrderItem records with positive net per warehouse unit (same convention as manual returns).
        // Net per Yandex unit = priceBeforeDiscount × (1-rate); sign comes from orderType=RETURN at display time.
        let totalRub = 0;

        for (const item of ret.items) {
          const effectiveDivisor = divisorBySku.get(item.shopSku) ?? globalDivisor;
          const netPerYandexUnit = item.priceBeforeDiscount * (1 - commissionRate / 100);
          const warehouseQty = item.count * effectiveDivisor;

          const dims = dimensionsById.get(item.productId);
          const quantityM2 = dims
            ? (dims.length_mm * dims.width_mm * warehouseQty) / 1_000_000
            : null;

          let priceRubKopecks: number;
          let itemTotal: number;
          let priceUnit: PriceUnitEnum;

          if (dims && quantityM2) {
            const m2PerYandexUnit = (dims.length_mm * dims.width_mm * effectiveDivisor) / 1_000_000;
            priceRubKopecks = Math.round((netPerYandexUnit / m2PerYandexUnit) * 100);
            itemTotal = Math.round(quantityM2 * priceRubKopecks);
            priceUnit = PriceUnitEnum.M2;
          } else {
            priceRubKopecks = Math.round((netPerYandexUnit / effectiveDivisor) * 100);
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
        }

        await tx.order.update({ where: { id: created.id }, data: { totalRub } });

        await tx.yandexReturnData.create({
          data: {
            yandexReturnId: ret.yandexReturnId,
            yandexOrderId: ret.yandexOrderId,
            returnType: ret.returnType,
            refundStatus: ret.refundStatus,
            shipmentStatus: ret.shipmentStatus,
            buyerRefundRub: ret.buyerRefundRub,
            orderId: created.id,
          },
        });

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
