import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";

import { requireAdmin } from "@/lib/requireAdmin";
import { db } from "@/db";
import { ProductGroup } from "@prisma/client";
import ProductGroupsList from "@/components/admin/product/product-group/ProductGroupsList";

export default async function AllProductGroupsPage() {
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
          <h1 className="admin-form-header mt-10">Все группы товаров</h1>
          <div className=" mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/product-groups/create"
            >
              Создать группу товаров
            </Link>
          </div>
          <ProductGroupsList itemsData={productGroups} />
          {/* <UsersList /> */}
        </div>
      </div>
    </>
  );
}
