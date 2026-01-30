"use server";

import { db } from "@/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createVariantSchema } from "@/zod/product/product-variant";

export interface VariantFormState {
  errors: {
    variantName?: string[];
    productId?: string[];
    _form?: string[];
  };
}

export async function createVariant(
  formState: VariantFormState,
  formData: FormData
): Promise<VariantFormState> {
  const result = createVariantSchema.safeParse({
    variantName: formData.get("variantName"),
    productId: formData.get("productId"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await db.productVariant.create({
      data: {
        variantName: result.data.variantName,
        productId: result.data.productId,
        warehouseQuantity: 0,
      },
    });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        errors: {
          variantName: ["Вариант с таким названием уже существует"],
        },
      };
    }
    return {
      errors: {
        _form: ["Не удалось создать вариант"],
      },
    };
  }

  revalidatePath(`/admin/products/update/${result.data.productId}`);

  return { errors: {} };
}
