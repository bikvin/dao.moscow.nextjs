import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";
import { db } from "@/db";
import ProductsList from "@/components/admin/product/product/ProductsList";
import { ProductWithGroup } from "@/types/product/productWithGroup";
import { Pagination } from "@/components/admin/Pagination";
import { FilterState, ProductListFilters } from "@/components/admin/product/ProductListFilters";
import { ProductStatusEnum } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; sku?: string; type?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const sku = searchParams.sku ?? "";
  const type = searchParams.type ?? ProductStatusEnum.ACTIVE;

  const where = {
    ...(sku && { sku: { contains: sku, mode: "insensitive" as const } }),
    ...(type && { status: type as ProductStatusEnum }),
  };

  let products: ProductWithGroup[];
  let totalPages: number;

  try {
    const [productData, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { productGroup: true },
        orderBy: [
          { productGroup: { displayOrder: "asc" } },
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.product.count({ where }),
    ]);

    products = productData;
    totalPages = Math.ceil(total / PAGE_SIZE);
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  const filterState: FilterState = { sku, dateFrom: "", dateTo: "", type: searchParams.type ?? ProductStatusEnum.ACTIVE };

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Все товары</h1>
          <div className="mt-10 flex justify-end">
            <Link className="link-button link-button-green" href="/admin/products/create">
              Создать товар
            </Link>
          </div>

          <div className="mt-6">
            <ProductListFilters
              current={filterState}
              typeOptions={[
                { value: ProductStatusEnum.ACTIVE, label: "Активные" },
                { value: ProductStatusEnum.CANCELLED, label: "Снятые с продажи" },
              ]}
              allTypeValue=""
              showDates={false}
            />
          </div>

          <ProductsList productData={products} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/products"
            searchParams={searchParams}
          />
        </div>
      </div>
    </>
  );
}
