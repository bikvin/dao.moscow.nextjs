import ProductForm from "@/components/admin/product/productForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { Product, ProductGroup } from "@prisma/client";

export default async function UpdateProductPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const productId = params.id;

  let productGroups: ProductGroup[] = [];
  let product: Product | null = null;

  try {
    const [productData, productGroupData] = await Promise.all([
      db.product.findUnique({
        where: { id: productId },
      }),
      db.productGroup.findMany({
        orderBy: [
          { displayOrder: "asc" }, // Primary sort by 'order' column
          { createdAt: "desc" }, // Secondary sort by 'createdAt' column
        ],
      }),
    ]);

    productGroups = productGroupData;
    product = productData;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  if (!product) {
    return <div className="text-red-800">Продукт с таким id не найден.</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Редактировать продукт</h1>
          <ProductForm
            id={product.id}
            sku={product.sku}
            descriptionShort={product.descriptionShort ?? undefined}
            descriptionLong={product.descriptionLong ?? undefined}
            imageGroupName={product.imageGroupName}
            imageData={JSON.parse(product.fileNamesArr)}
            status={product.status}
            productGroupId={product.productGroupId ?? undefined}
            productGroups={productGroups}
            displayOrder={product.displayOrder ?? undefined}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
