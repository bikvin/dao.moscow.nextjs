import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";

import { requireAdmin } from "@/lib/requireAdmin";
import { db } from "@/db";
import ProductsList from "@/components/admin/product/ProductsList";
import { ProductWithGroup } from "@/types/product/productWithGroup";

export default async function AllProductsPage() {
  await requireAdmin();

  let products: ProductWithGroup[];

  try {
    const [productData] = await Promise.all([
      db.product.findMany({
        include: {
          productGroup: true,
        },
        orderBy: [
          { productGroup: { displayOrder: "asc" } },
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
      }),
    ]);

    if (!productData) {
      return <div className="text-red-800">Данные не найдены.</div>;
    }

    products = productData;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Все товары</h1>
          <div className=" mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/create"
            >
              Создать товар
            </Link>
          </div>

          <ProductsList productData={products} />
        </div>
      </div>
    </>
  );
}
