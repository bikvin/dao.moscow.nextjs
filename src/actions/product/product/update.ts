"use server";

import { db } from "@/db";
import { CurrencyEnum, Prisma, PriceTypeEnum } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ProductFormState } from "./ProductFormState";
import { editProductSchema } from "@/zod/product/product";
import { deleteUnusedFromS3 } from "@/lib/awsS3/deleteUnusedFromS3";

export async function updateProduct(
  formState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const result = editProductSchema.safeParse({
    id: formData.get("id"),
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
    retailPrice: formData.get("retailPrice") || undefined,
    retailCurrency: formData.get("retailCurrency") || undefined,
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await db.product.update({
      where: {
        id: result.data.id,
      },
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
      },
    });
    await deleteUnusedFromS3(
      `${result.data.imageGroupName}`,
      result.data.imagesArrString
    );

    const priceUpserts = [];
    if (result.data.dealerPrice && result.data.dealerCurrency) {
      priceUpserts.push(
        db.price.upsert({
          where: { productId_type: { productId: result.data.id, type: PriceTypeEnum.DEALER } },
          update: { priceInCents: Math.round(Number(result.data.dealerPrice) * 100), currency: result.data.dealerCurrency as CurrencyEnum },
          create: { productId: result.data.id, type: PriceTypeEnum.DEALER, priceInCents: Math.round(Number(result.data.dealerPrice) * 100), currency: result.data.dealerCurrency as CurrencyEnum },
        })
      );
    }
    if (result.data.retailPrice && result.data.retailCurrency) {
      priceUpserts.push(
        db.price.upsert({
          where: { productId_type: { productId: result.data.id, type: PriceTypeEnum.RETAIL } },
          update: { priceInCents: Math.round(Number(result.data.retailPrice) * 100), currency: result.data.retailCurrency as CurrencyEnum },
          create: { productId: result.data.id, type: PriceTypeEnum.RETAIL, priceInCents: Math.round(Number(result.data.retailPrice) * 100), currency: result.data.retailCurrency as CurrencyEnum },
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
        errors: {
          _form: ["Something went wrong"],
        },
      };
    }
  }

  revalidatePath("/admin/products");

  redirect("/admin/products");
}
