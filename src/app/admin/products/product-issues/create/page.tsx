import { ProductIssueForm } from "@/components/admin/product/product-issue/ProductIssueForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { ProductWithVariants } from "@/types/product/productWithVariants";

export default async function CreateProductIssuePage({
  searchParams,
}: {
  searchParams: { productId?: string };
}) {
  await requireAdmin();

  const preselectedProductId = searchParams.productId;

  let products: ProductWithVariants[];

  try {
    const [productData] = await Promise.all([
      db.product.findMany({
        orderBy: [
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          productVariants: true,
        },
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
          <h1 className="admin-form-header mt-10">Добавить списание</h1>
          <ProductIssueForm products={products} productId={preselectedProductId} />
        </div>
      </div>
    </>
  );
}
