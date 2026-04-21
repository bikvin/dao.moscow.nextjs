"use server";

import { db } from "@/db";
import { VariantStatusEnum } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function toggleVariantStatus(
  variantId: string,
  productId: string
): Promise<void> {
  const variant = await db.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    select: { status: true },
  });

  const newStatus =
    variant.status === VariantStatusEnum.ACTIVE
      ? VariantStatusEnum.INACTIVE
      : VariantStatusEnum.ACTIVE;

  await db.productVariant.update({
    where: { id: variantId },
    data: { status: newStatus },
  });

  revalidatePath(`/admin/products/update/${productId}`);
}
