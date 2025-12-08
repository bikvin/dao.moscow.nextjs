import ProductForm from "@/components/admin/product/productForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { ProductGroup } from "@prisma/client";

export default async function CreateProductPage() {
  await requireAdmin();

  let productGroups: ProductGroup[];

  try {
    const [productGroupData] = await Promise.all([
      db.productGroup.findMany({
        orderBy: [
          { displayOrder: "asc" }, // Primary sort by 'order' column
          { createdAt: "desc" }, // Secondary sort by 'createdAt' column
        ],
      }),
    ]);

    if (!productGroupData) {
      return <div className="text-red-800">Данные не найдены.</div>;
    }

    productGroups = productGroupData;
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
          {/* <UserForm /> */}
          <ProductForm productGroups={productGroups} />
        </div>
      </div>
    </>
  );
}
