import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { OzonMappingForm } from "@/components/admin/ozon/OzonMappingForm";
import { notFound } from "next/navigation";

export default async function UpdateOzonMappingPage({
  params,
}: {
  params: { id: string };
}) {
  const [mapping, products] = await Promise.all([
    db.ozonMapping.findUnique({ where: { id: params.id } }),
    db.product.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] }),
  ]);

  if (!mapping) notFound();

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Редактировать маппинг Ozon</h1>
          <OzonMappingForm
            id={mapping.id}
            products={products}
            productId={mapping.productId}
            ozonOfferId={mapping.ozonOfferId}
            buffer={mapping.buffer}
            divisor={mapping.divisor}
            isEdit
          />
        </div>
      </div>
    </>
  );
}
