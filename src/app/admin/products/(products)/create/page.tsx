import ProductForm from "@/components/admin/product/product/productForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ChipSize, ProductGroup } from "@prisma/client";

export default async function CreateProductPage() {
  let productGroups: ProductGroup[] = [];
  let chipSizes: ChipSize[] = [];

  try {
    [productGroups, chipSizes] = await Promise.all([
      db.productGroup.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      }),
      db.chipSize.findMany({
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      }),
    ]);
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Добавить товар</h1>
          <ProductForm productGroups={productGroups} chipSizes={chipSizes} />
        </div>
      </div>
    </>
  );
}
