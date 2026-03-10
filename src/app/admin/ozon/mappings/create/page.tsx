import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { OzonMappingForm } from "@/components/admin/ozon/OzonMappingForm";

export default async function CreateOzonMappingPage() {
  const products = await db.product.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Добавить маппинг Ozon</h1>
          <OzonMappingForm products={products} />
        </div>
      </div>
    </>
  );
}
