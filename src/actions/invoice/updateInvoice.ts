"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InvoiceTypeEnum, PriceUnitEnum } from "@prisma/client";
import { type CreateInvoiceFormState } from "./createInvoice";

const schema = z.object({
  partnerId: z.string().min(1, "Выберите партнёра"),
  invoiceDate: z.string().min(1, "Введите дату"),
  invoiceType: z.nativeEnum(InvoiceTypeEnum),
});

export async function updateInvoice(
  invoiceId: string,
  _formState: CreateInvoiceFormState,
  formData: FormData
): Promise<CreateInvoiceFormState> {
  const result = schema.safeParse({
    partnerId: formData.get("partnerId"),
    invoiceDate: formData.get("invoiceDate"),
    invoiceType: formData.get("invoiceType"),
  });

  if (!result.success) {
    return { errors: { _form: result.error.flatten().formErrors } };
  }

  const invoiceDate = new Date(result.data.invoiceDate);
  if (isNaN(invoiceDate.getTime())) {
    return { errors: { _form: ["Неверная дата"] } };
  }

  const orderId = (formData.get("orderId") as string) || null;
  const deliveryPriceRub = Math.round(
    (parseFloat(formData.get("deliveryPriceRub") as string) || 0) * 100
  );
  const discountPercent = parseFloat(formData.get("discountPercent") as string) || 0;

  const productIds = formData.getAll("productId") as string[];
  const variantIds = formData.getAll("productVariantId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const priceUnits = formData.getAll("priceUnit") as string[];
  const priceRubs = formData.getAll("priceRub") as string[];
  const quantityM2s = formData.getAll("quantityM2") as string[];

  const sellerLegalName = (formData.get("sellerLegalName") as string) || "";
  const sellerInn = (formData.get("sellerInn") as string) || "";
  const sellerKpp = (formData.get("sellerKpp") as string) || "";
  const sellerBankName = (formData.get("sellerBankName") as string) || "";
  const sellerShortBankName = (formData.get("sellerShortBankName") as string) || "";
  const sellerBik = (formData.get("sellerBik") as string) || "";
  const sellerBankAccNo = (formData.get("sellerBankAccNo") as string) || "";
  const sellerAccNo = (formData.get("sellerAccNo") as string) || "";

  const buyerLegalName = (formData.get("buyerLegalName") as string) || "";
  const buyerInn = (formData.get("buyerInn") as string) || "";
  const buyerKpp = (formData.get("buyerKpp") as string) || "";
  const buyerBankName = (formData.get("buyerBankName") as string) || "";
  const buyerBik = (formData.get("buyerBik") as string) || "";
  const buyerBankAccNo = (formData.get("buyerBankAccNo") as string) || "";
  const buyerAccNo = (formData.get("buyerAccNo") as string) || "";

  try {
    await db.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId } });

      let itemsTotal = 0;
      const itemsData: {
        productId: string;
        productVariantId: string;
        quantity: number;
        quantityM2: number | null;
        priceUnit: PriceUnitEnum;
        priceRub: number;
        totalRub: number;
      }[] = [];

      for (let i = 0; i < productIds.length; i++) {
        if (!productIds[i] || !variantIds[i]) continue;
        const qty = parseInt(quantities[i]) || 0;
        if (qty <= 0) continue;

        const priceUnit = priceUnits[i] as PriceUnitEnum;
        const priceRubKopecks = Math.round((parseFloat(priceRubs[i]) || 0) * 100);
        const quantityM2 = quantityM2s[i] ? parseFloat(quantityM2s[i]) : null;

        const itemTotal =
          priceUnit === PriceUnitEnum.M2 && quantityM2 !== null
            ? Math.round(quantityM2 * priceRubKopecks)
            : qty * priceRubKopecks;

        itemsData.push({
          productId: productIds[i],
          productVariantId: variantIds[i],
          quantity: qty,
          quantityM2,
          priceUnit,
          priceRub: priceRubKopecks,
          totalRub: itemTotal,
        });
        itemsTotal += itemTotal;
      }

      const totalRub =
        Math.round(itemsTotal * (1 - discountPercent / 100)) + deliveryPriceRub;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceDate,
          invoiceType: result.data.invoiceType,
          deliveryPriceRub,
          discountPercent,
          totalRub,
          sellerLegalName,
          sellerInn,
          sellerKpp,
          sellerBankName,
          sellerShortBankName,
          sellerBik,
          sellerBankAccNo,
          sellerAccNo,
          buyerLegalName,
          buyerInn,
          buyerKpp,
          buyerBankName,
          buyerBik,
          buyerBankAccNo,
          buyerAccNo,
          partnerId: result.data.partnerId,
          orderId,
          items: { create: itemsData },
        },
      });
    });
  } catch (err: unknown) {
    return {
      errors: { _form: [err instanceof Error ? err.message : "Что-то пошло не так"] },
    };
  }

  revalidatePath("/admin/invoices");
  return { success: { message: "Счёт обновлён" } };
}
