import { db } from "@/db";
import { VariantStatusEnum } from "@prisma/client";
import { PublicWarehouseTableClient } from "./PublicWarehouseTableClient";

export default async function PublicWarehouseTable() {
  const productGroups = await db.productGroup.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: {
      products: {
        orderBy: [{ displayOrder: "asc" }, { sku: "asc" }],
        include: {
          productVariants: { where: { status: VariantStatusEnum.ACTIVE } },
        },
      },
    },
  });

  return (
    <div className="mt-10">
      <PublicWarehouseTableClient productGroups={productGroups} />
    </div>
  );
}
