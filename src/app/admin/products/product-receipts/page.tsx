import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";
import { db } from "@/db";
import { ProductReceiptWithProductVariant } from "@/types/product/productReceipt/productReceiptWithProductVariant";
import ProductReceiptsList from "@/components/admin/product/product-receipt/ProductReceipsList";
import { Pagination } from "@/components/admin/Pagination";
import {
  FilterState,
  ProductListFilters,
} from "@/components/admin/product/ProductListFilters";
import { ProductReceiptTypeEnum } from "@prisma/client";

const PAGE_SIZE = 50;

export default async function AllProductReciptsPage({
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
    ...(Object.keys(dateFilter).length > 0 && { receiptDate: dateFilter }),
    ...(type && { type: type as ProductReceiptTypeEnum }),
  };

  const orderBy = [
    { receiptDate: "desc" as const },
    { createdAt: "desc" as const },
  ];

  let productReceipts: ProductReceiptWithProductVariant[];
  let totalPages: number;

  try {
    const [productReceiptData, total] = await Promise.all([
      db.productReceipt.findMany({
        where,
        include: { productVariant: { include: { product: true } } },
        orderBy,
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.productReceipt.count({ where }),
    ]);

    productReceipts = productReceiptData;
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
          <h1 className="admin-form-header mt-10">Все приходы товаров</h1>
          <div className="mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/product-receipts/create"
            >
              Создать приход
            </Link>
          </div>

          <div className="mt-6">
            <ProductListFilters
              current={filterState}
              typeOptions={[
                { value: ProductReceiptTypeEnum.RETURN, label: "Возврат" },
                { value: ProductReceiptTypeEnum.SHIPMENT, label: "Поставка" },
                {
                  value: ProductReceiptTypeEnum.CORRECTION,
                  label: "Коррекция",
                },
              ]}
            />
          </div>

          <ProductReceiptsList itemsData={productReceipts} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/products/product-receipts"
            searchParams={searchParams}
          />
        </div>
      </div>
    </>
  );
}
