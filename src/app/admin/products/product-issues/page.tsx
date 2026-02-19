import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";

import { requireAdmin } from "@/lib/requireAdmin";
import { db } from "@/db";

import { ProductIssueWithProductVariant } from "@/types/product/productIssue/productIssueWithProductVariant";
import ProductIssuesList from "@/components/admin/product/product-issue/ProductIssuesList";

export default async function AllProductIssuesPage() {
  await requireAdmin();

  let productIssues: ProductIssueWithProductVariant[];

  try {
    const [productIssueData] = await Promise.all([
      db.productIssue.findMany({
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    if (!productIssueData) {
      return <div className="text-red-800">Данные не найдены.</div>;
    }

    productIssues = productIssueData;
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
        </div>
      </div>
    </>
  );
}
