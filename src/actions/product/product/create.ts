"use server";

import { db } from "@/db";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductFormState } from "./ProductFormState";
import { createProductSchema } from "@/zod/product/product";
import { Prisma } from "@prisma/client";

export async function createProduct(
  formState: ProductFormState,
  formData: FormData
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
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    await db.product.create({
      data: {
        sku: result.data.sku,
        imageGroupName: result.data.imageGroupName,
        fileNamesArr: result.data.imagesArrString,
        status: result.data.status,
        productGroupId: result.data.productGroupId,
        descriptionShort: result.data.descriptionShort,
        descriptionLong: result.data.descriptionLong,
        displayOrder: Number(result.data.displayOrder),
        productVariants: {
          create: {
            variantName: "Основной",
            warehouseQuantity: 0,
          },
        },
      },
    });
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
