import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { YandexMappingForm } from "@/components/admin/yandex/YandexMappingForm";

export default async function CreateYandexMappingPage() {
  const products = await db.product.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Добавить маппинг</h1>
          <YandexMappingForm products={products} />
        </div>
      </div>
    </>
  );
}
