import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";
import { db } from "@/db";
import { ProductReserveWithProductVariant } from "@/types/product/productReserve/productReserveWithProductVariant";
import ProductReservesList from "@/components/admin/product/product-reserve/ProductReservesList";

export default async function AllProductReservesPage() {
  let productReserves: ProductReserveWithProductVariant[];

  try {
    const data = await db.productReserve.findMany({
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [{ reserveDate: "desc" }, { createdAt: "desc" }],
    });

    if (!data) {
      return <div className="text-red-800">Данные не найдены.</div>;
    }

    productReserves = data;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Все резервы товаров</h1>
          <div className="mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/product-reserves/create"
            >
              Создать резерв
            </Link>
          </div>

          <ProductReservesList itemsData={productReserves} />
        </div>
      </div>
    </>
  );
}
