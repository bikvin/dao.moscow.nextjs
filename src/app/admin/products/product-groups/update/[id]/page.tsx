import ProductGroupForm from "@/components/admin/product/product-group/productGroupForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function UpdateProductGroupPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const productGroupId = params.id;
  const productGroup = await db.productGroup.findUnique({
    where: { id: productGroupId },
  });

  if (!productGroup) {
    return <div>Группа с таким id не найден</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Редактировать шруппу</h1>
          <ProductGroupForm
            id={productGroup.id}
            name={productGroup.name}
            displayOrder={productGroup.displayOrder}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
