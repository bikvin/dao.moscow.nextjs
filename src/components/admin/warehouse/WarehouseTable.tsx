import { db } from "@/db";
import { WarehouseTableClient } from "./WarehouseTableClient";

export default async function WarehouseTable() {
  const productGroups = await db.productGroup.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: {
      products: {
        orderBy: [{ displayOrder: "asc" }, { sku: "asc" }],
        include: {
          productVariants: {
            include: {
              productReserves: {
                where: { status: "ACTIVE" },
                orderBy: { reserveDate: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold tracking-wide mb-4">
        Остатки на складе
      </h2>
      <WarehouseTableClient productGroups={productGroups} />
    </div>
  );
}
