import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import WarehouseTable from "@/components/admin/warehouse/WarehouseTable";

export default async function ProfilePage() {
  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] mx-auto">
          <WarehouseTable />
        </div>
      </div>
    </>
  );
}
