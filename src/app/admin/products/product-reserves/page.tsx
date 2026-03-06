import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";
import { db } from "@/db";
import { ProductReserveWithProductVariant } from "@/types/product/productReserve/productReserveWithProductVariant";
import ProductReservesList from "@/components/admin/product/product-reserve/ProductReservesList";
import { Pagination } from "@/components/admin/Pagination";
import {
  FilterState,
  ProductListFilters,
} from "@/components/admin/product/ProductListFilters";
import { ProductReserveStatusEnum } from "@prisma/client";

const PAGE_SIZE = 10;

export default async function AllProductReservesPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    sku?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
  };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const sku = searchParams.sku ?? "";
  const dateFrom = searchParams.dateFrom ?? "";
  const dateTo = searchParams.dateTo ?? "";
  const type = searchParams.type ?? "";

  const dateFilter = {
    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
    ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999") } : {}),
  };

  const where = {
    ...(sku && {
      productVariant: {
        product: { sku: { contains: sku, mode: "insensitive" as const } },
      },
    }),
    ...(Object.keys(dateFilter).length > 0 && { reserveDate: dateFilter }),
    ...(type && { status: type as ProductReserveStatusEnum }),
  };

  const orderBy = [{ reserveDate: "desc" as const }, { createdAt: "desc" as const }];

  let productReserves: ProductReserveWithProductVariant[];
  let totalPages: number;

  try {
    const [data, total] = await Promise.all([
      db.productReserve.findMany({
        where,
        include: { productVariant: { include: { product: true } } },
        orderBy,
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.productReserve.count({ where }),
    ]);

    productReserves = data;
    totalPages = Math.ceil(total / PAGE_SIZE);
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  const filterState: FilterState = { sku, dateFrom, dateTo, type };

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

          <div className="mt-6">
            <ProductListFilters
              current={filterState}
              typeOptions={[
                { value: ProductReserveStatusEnum.ACTIVE, label: "Активен" },
                {
                  value: ProductReserveStatusEnum.FULFILLED,
                  label: "Выполнен",
                },
                {
                  value: ProductReserveStatusEnum.CANCELLED,
                  label: "Отменён",
                },
              ]}
            />
          </div>

          <ProductReservesList itemsData={productReserves} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/products/product-reserves"
            searchParams={searchParams}
          />
        </div>
      </div>
    </>
  );
}
