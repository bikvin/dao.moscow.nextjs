import PublicWarehouseTable from "@/components/client/warehouse/PublicWarehouseTable";

export const dynamic = "force-dynamic";

export default function CurrentStockPage() {
  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="w-[90%] mx-auto">
        <h1 className="text-3xl font-bold mt-10 mb-4">Текущие остатки</h1>
        <PublicWarehouseTable />
      </div>
    </div>
  );
}
