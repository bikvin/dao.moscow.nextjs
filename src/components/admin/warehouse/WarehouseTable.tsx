import { db } from "@/db";
import { WarehouseProductRow } from "./WarehouseProductRow";

export default async function WarehouseTable() {
  const products = await db.product.findMany({
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
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold tracking-wide mb-4">
        Остатки на складе
      </h2>

      {/* Group headers */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] gap-2 px-3 text-xs text-slate-400">
        <div />
        <div className="col-span-2 text-center border-b border-slate-200 pb-1">
          На складе
        </div>
        <div className="col-span-2 text-center border-b border-slate-200 pb-1">
          Доступно
        </div>
        <div className="col-span-2 text-center border-b border-slate-200 pb-1">
          Зарезервировано
        </div>
        <div />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] gap-2 px-3 pb-2 text-sm text-slate-400 border-b">
        <div>Товар</div>
        <div className="text-center">листов</div>
        <div className="text-center">м²</div>
        <div className="text-center">листов</div>
        <div className="text-center">м²</div>
        <div className="text-center">листов</div>
        <div className="text-center">м²</div>
        <div className="text-center">Активные резервы</div>
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
