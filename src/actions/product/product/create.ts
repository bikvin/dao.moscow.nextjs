"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductFormState } from "./ProductFormState";
import { createProductSchema } from "@/zod/product/product";
import { CurrencyEnum, Prisma, PriceTypeEnum } from "@prisma/client";

export async function createProduct(
  formState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    console.log("status", formData.get("status"));

    const result = createProductSchema.safeParse({
      sku: formData.get("sku"),
      imageGroupName: formData.get("imageGroupName"),
      imagesArrString: formData.get("imagesArrString"),
      status: formData.get("status"),
      productGroupId: formData.get("productGroupId"),
      descriptionShort: formData.get("descriptionShort"),
      descriptionLong: formData.get("descriptionLong"),
      displayOrder: formData.get("displayOrder"),
      length_mm: formData.get("length_mm"),
      width_mm: formData.get("width_mm"),
      thickness_mm: formData.get("thickness_mm"),
      dealerPrice: formData.get("dealerPrice") || undefined,
      dealerCurrency: formData.get("dealerCurrency") || undefined,
      dealerUnit: formData.get("dealerUnit") || undefined,
      dealerQuantity: formData.get("dealerQuantity") || undefined,
      retailPrice: formData.get("retailPrice") || undefined,
      retailCurrency: formData.get("retailCurrency") || undefined,
      retailUnit: formData.get("retailUnit") || undefined,
      retailQuantity: formData.get("retailQuantity") || undefined,
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    const product = await db.product.create({
      data: {
        sku: result.data.sku,
        imageGroupName: result.data.imageGroupName,
        fileNamesArr: result.data.imagesArrString,
        status: result.data.status,
        productGroupId: result.data.productGroupId,
        descriptionShort: result.data.descriptionShort,
        descriptionLong: result.data.descriptionLong,
        displayOrder: Number(result.data.displayOrder),
        length_mm: result.data.length_mm,
        width_mm: result.data.width_mm,
        thickness_mm: result.data.thickness_mm,
        productVariants: {
          create: {
            variantName: "Основной",
            warehouseQuantity: 0,
          },
        },
      },
    });

    const priceUpserts = [];
    if (result.data.dealerPrice && result.data.dealerCurrency) {
      const dealerUnit = (result.data.dealerUnit ?? "M2") as "M2" | "ITEM";
      const dealerQuantity = dealerUnit === "ITEM" ? (result.data.dealerQuantity ?? 1) : 1;
      priceUpserts.push(
        db.price.upsert({
          where: { productId_type: { productId: product.id, type: PriceTypeEnum.DEALER } },
          update: { priceInCents: Math.round(Number(result.data.dealerPrice) * 100), currency: result.data.dealerCurrency as CurrencyEnum, unit: dealerUnit, quantity: dealerQuantity },
          create: { productId: product.id, type: PriceTypeEnum.DEALER, priceInCents: Math.round(Number(result.data.dealerPrice) * 100), currency: result.data.dealerCurrency as CurrencyEnum, unit: dealerUnit, quantity: dealerQuantity },
        })
      );
    }
    if (result.data.retailPrice && result.data.retailCurrency) {
      const retailUnit = (result.data.retailUnit ?? "M2") as "M2" | "ITEM";
      const retailQuantity = retailUnit === "ITEM" ? (result.data.retailQuantity ?? 1) : 1;
      priceUpserts.push(
        db.price.upsert({
          where: { productId_type: { productId: product.id, type: PriceTypeEnum.RETAIL } },
          update: { priceInCents: Math.round(Number(result.data.retailPrice) * 100), currency: result.data.retailCurrency as CurrencyEnum, unit: retailUnit, quantity: retailQuantity },
          create: { productId: product.id, type: PriceTypeEnum.RETAIL, priceInCents: Math.round(Number(result.data.retailPrice) * 100), currency: result.data.retailCurrency as CurrencyEnum, unit: retailUnit, quantity: retailQuantity },
        })
      );
    }
    if (priceUpserts.length > 0) await Promise.all(priceUpserts);
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        errors: {
          sku: ["Товар с таким SKU уже существует"],
        },
      };
    }

    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      };
    } else {
      return {
        errors: { _form: ["Что-то пошло не так"] },
      };
    }
  }

  revalidatePath("/admin/product");

  redirect("/admin/products");
}
