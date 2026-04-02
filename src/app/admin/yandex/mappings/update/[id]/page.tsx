import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { YandexMappingForm } from "@/components/admin/yandex/YandexMappingForm";
import { notFound } from "next/navigation";

export default async function UpdateYandexMappingPage({
  params,
}: {
  params: { id: string };
}) {
  const [mapping, products] = await Promise.all([
    db.yandexMarketMapping.findUnique({ where: { id: params.id } }),
    db.product.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] }),
  ]);

  if (!mapping) notFound();

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Редактировать маппинг</h1>
          <YandexMappingForm
            id={mapping.id}
            products={products}
            productId={mapping.productId}
            yandexSku={mapping.yandexSku}
            buffer={mapping.buffer}
            divisor={mapping.divisor}
            priceMarkup={mapping.priceMarkup}
            isEdit
          />
        </div>
      </div>
    </>
  );
}
