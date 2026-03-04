import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";

import { db } from "@/db";

import { ProductIssueWithProductVariant } from "@/types/product/productIssue/productIssueWithProductVariant";
import ProductIssuesList from "@/components/admin/product/product-issue/ProductIssuesList";
import { Pagination } from "@/components/admin/Pagination";

const PAGE_SIZE = 30;

export default async function AllProductIssuesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  let productIssues: ProductIssueWithProductVariant[];
  let totalPages: number;

  try {
    const [productIssueData, total] = await Promise.all([
      db.productIssue.findMany({
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.productIssue.count(),
    ]);

    productIssues = productIssueData;
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
          <h1 className="admin-form-header mt-10">Все списания товаров</h1>
          <div className=" mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/product-issues/create"
            >
              Создать списание
            </Link>
          </div>

          <ProductIssuesList itemsData={productIssues} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/products/product-issues"
          />
        </div>
      </div>
    </>
  );
}
