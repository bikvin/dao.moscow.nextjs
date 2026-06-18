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

export type ImportOzonReturnItem = {
  offerId: string;
  ozonSku: number;
  quantity: number;               // Ozon units returned
  priceRub: number;               // buyer retail price per Ozon unit
  priceWithoutCommissionRub: number; // price × (1-rate) per Ozon unit
  productId: string;
  variantId: string;
};

export type ImportOzonReturn = {
  postingNumber: string;
  ozonOrderId: string;
  returnType: string;             // "Cancellation" | "FullReturn" | "ClientReturn"
  returnDate: string | null;
  payoutRub: number;              // positive absolute value
  returnLogisticFeeRub: number;   // actual or estimated
  feesSettled: boolean;
  sellerImpactRub: number;        // payoutRub + returnLogisticFeeRub
  items: ImportOzonReturnItem[];
};

// Imports selected Ozon FBS returns into the database.
// For each return:
//   - Creates an Order (orderType=RETURN, source=OZON, totalRub=sellerImpactRub)
//   - Creates OrderItem records using per-unit payout expanded by divisor to warehouse units
//   - Creates an OzonReturnData record with posting metadata and fee breakdown
// Negative signs are shown in the UI because orderType=RETURN, not from stored negative values.
export async function importOzonReturns(
  returns: ImportOzonReturn[],
  partnerId: string
): Promise<{ imported: number; orderIds: string[] } | { error: string }> {
  if (returns.length === 0) return { imported: 0, orderIds: [] };

  try {
    const [partner, globalDivisorSetting, paymentMethodIdSetting] = await Promise.all([
      db.partner.findUnique({
        where: { id: partnerId },
        include: { names: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 } },
      }),
      db.settings.findUnique({ where: { field: "ozonDefaultDivisor" } }),
      db.settings.findUnique({ where: { field: "ozonPaymentMethodId" } }),
    ]);

    if (!partner) return { error: "Партнёр не найден" };
    const globalDivisor = globalDivisorSetting ? parseInt(globalDivisorSetting.value, 10) : 1;
    const marketplacePaymentMethodId = paymentMethodIdSetting?.value ?? null;

    const allOfferIds = [...new Set(returns.flatMap((r) => r.items.map((i) => i.offerId)))];
    const allProductIds = [...new Set(returns.flatMap((r) => r.items.map((i) => i.productId)))];

    const [mappings, products] = await Promise.all([
      db.ozonMapping.findMany({
        where: { ozonOfferId: { in: allOfferIds } },
        select: { ozonOfferId: true, divisor: true },
      }),
      db.product.findMany({
        where: { id: { in: allProductIds } },
        select: { id: true, length_mm: true, width_mm: true },
      }),
    ]);

    const divisorByOfferId = new Map(mappings.map((m) => [m.ozonOfferId, m.divisor]));
    const dimensionsById = new Map(products.map((p) => [p.id, p]));

    let importedCount = 0;
    const orderIds: string[] = [];

    for (const ret of returns) {
      const returnDate = ret.returnDate ? new Date(ret.returnDate) : new Date();
      const year = returnDate.getFullYear();

      const { orderId } = await db.$transaction(async (tx) => {
        const last = await tx.order.findFirst({
          where: { year },
          orderBy: { sequenceNumber: "desc" },
          select: { sequenceNumber: true },
        });
        const sequenceNumber = (last?.sequenceNumber ?? 0) + 1;

        const typeLabel =
          ret.returnType === "Cancellation"
            ? "отмена"
            : ret.returnType === "FullReturn"
            ? "отказ"
            : "возврат";

        const created = await tx.order.create({
          data: {
            year,
            sequenceNumber,
            orderDate: returnDate,
            orderType: OrderTypeEnum.RETURN,
            status: OrderStatusEnum.RESERVE,
            source: OrderSourceEnum.OZON,
            partnerId,
            paymentStatus: PaymentStatusEnum.PAID,
            paymentMethodId: marketplacePaymentMethodId ?? undefined,
            note: `Ozon ${typeLabel} постинг #${ret.postingNumber} (импортировано)`,
            totalRub: 0,
          },
        });

        // Create OrderItem records — payout per warehouse unit, positive (sign from orderType=RETURN)
        for (const item of ret.items) {
          const effectiveDivisor = divisorByOfferId.get(item.offerId) ?? globalDivisor;
          const netPerOzonUnit = item.priceWithoutCommissionRub;
          const warehouseQty = item.quantity * effectiveDivisor;

          const dims = dimensionsById.get(item.productId);
          const quantityM2 = dims
            ? (dims.length_mm * dims.width_mm * warehouseQty) / 1_000_000
            : null;

          let priceRubKopecks: number;
          let itemTotal: number;
          let priceUnit: PriceUnitEnum;

          if (dims && quantityM2 && quantityM2 > 0) {
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
        }

        // totalRub = full impact in kopecks (formatRub divides by 100 for display)
        const totalRub = Math.round(ret.sellerImpactRub * 100);
        await tx.order.update({ where: { id: created.id }, data: { totalRub } });

        await tx.ozonReturnData.create({
          data: {
            postingNumber: ret.postingNumber,
            ozonOrderId: ret.ozonOrderId,
            returnType: ret.returnType,
            payoutRub: ret.payoutRub,
            returnLogisticFeeRub: ret.returnLogisticFeeRub,
            feesSettled: ret.feesSettled,
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
