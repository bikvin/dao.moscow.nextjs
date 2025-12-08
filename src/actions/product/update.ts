"use server";

import { db } from "@/db";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ProductFormState } from "./ProductFormState";
import { editProductSchema } from "@/zod/product";
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
      },
    });
    await deleteUnusedFromS3(
      `${result.data.imageGroupName}`,
      result.data.imagesArrString
    );
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
