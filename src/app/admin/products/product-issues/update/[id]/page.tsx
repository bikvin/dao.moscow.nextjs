import { ProductIssueForm } from "@/components/admin/product/product-issue/ProductIssueForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { ProductWithVariants } from "@/types/product/productWithVariants";
import { ProductIssue, ProductVariant } from "@prisma/client";

export default async function UpdateProductIssuePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const productIssueId = params.id;

  let products: ProductWithVariants[] = [];
  let productIssue: (ProductIssue & { productVariant: ProductVariant }) | null = null;

  try {
    const [productIssueData, productsData] = await Promise.all([
      db.productIssue.findUnique({
        where: { id: productIssueId },
        include: { productVariant: true },
      }),
      db.product.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        include: {
          productVariants: true,
        },
      }),
    ]);

    products = productsData;
    productIssue = productIssueData;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  if (!productIssue || !products) {
    return <div>Данные не найдены</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Редактировать списание</h1>
          <ProductIssueForm
            id={productIssue.id}
            productId={productIssue.productVariant.productId}
            productVariantId={productIssue.productVariantId}
            products={products}
            quantity={productIssue.quantity}
            description={productIssue.description}
            issueDate={productIssue.issueDate}
            issueType={productIssue.type}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
