import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";
import { db } from "@/db";
import { ProductReserveWithProductVariant } from "@/types/product/productReserve/productReserveWithProductVariant";
import ProductReservesList from "@/components/admin/product/product-reserve/ProductReservesList";
import { Pagination } from "@/components/admin/Pagination";

const PAGE_SIZE = 30;

export default async function AllProductReservesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  let productReserves: ProductReserveWithProductVariant[];
  let totalPages: number;

  try {
    const [data, total] = await Promise.all([
      db.productReserve.findMany({
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        orderBy: [{ reserveDate: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.productReserve.count(),
    ]);

    productReserves = data;
    totalPages = Math.ceil(total / PAGE_SIZE);
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/products/product-reserves"
          />
        </div>
      </div>
    </>
  );
}
