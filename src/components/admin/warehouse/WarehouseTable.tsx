import { db } from "@/db";
import { WarehouseProductRow } from "./WarehouseProductRow";

export default async function WarehouseTable() {
  const products = await db.product.findMany({
    include: { productVariants: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold tracking-wide mb-4">
        Остатки на складе
      </h2>

      {/* Header */}
      <div className="grid grid-cols-4 gap-2 px-3 pb-2 text-sm text-slate-400 border-b">
        <div>Товар</div>
        <div className="text-center">На складе</div>
        <div className="text-center">Зарезервировано</div>
        <div className="text-center">Доступно</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1 mt-2">
        {products.length === 0 && (
          <div className="text-center text-slate-400 py-6">
            Товары не найдены
          </div>
        )}
        {products.map((product) => (
          <WarehouseProductRow key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
