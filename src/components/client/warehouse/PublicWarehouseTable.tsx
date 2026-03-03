import { db } from "@/db";
import { PublicWarehouseTableClient } from "./PublicWarehouseTableClient";

export default async function PublicWarehouseTable() {
  const productGroups = await db.productGroup.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: {
      products: {
        orderBy: [{ displayOrder: "asc" }, { sku: "asc" }],
        include: {
          productVariants: true,
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
