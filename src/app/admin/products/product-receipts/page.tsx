import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";

import { db } from "@/db";

import { ProductReceiptWithProductVariant } from "@/types/product/productReceipt/productReceiptWithProductVariant";
import ProductReceiptsList from "@/components/admin/product/product-receipt/ProductReceipsList";
import { Pagination } from "@/components/admin/Pagination";

const PAGE_SIZE = 30;

export default async function AllProductReciptsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  let productReceipts: ProductReceiptWithProductVariant[];
  let totalPages: number;

  try {
    const [productReceiptData, total] = await Promise.all([
      db.productReceipt.findMany({
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        orderBy: [{ receiptDate: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.productReceipt.count(),
    ]);

    productReceipts = productReceiptData;
    totalPages = Math.ceil(total / PAGE_SIZE);
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Все приходы товаров</h1>
          <div className=" mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/product-receipts/create"
            >
              Создать приход
            </Link>
          </div>

          <ProductReceiptsList itemsData={productReceipts} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/products/product-receipts"
          />
        </div>
      </div>
    </>
  );
}
