import ProductForm from "@/components/admin/product/product/productForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ProductWithVariants } from "@/types/product/productWithVariants";
import { ChipSize, Price, ProductGroup } from "@prisma/client";

export default async function UpdateProductPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = params.id;

  let productGroups: ProductGroup[] = [];
  let chipSizes: ChipSize[] = [];
  let product: ProductWithVariants | null = null;
  let prices: Price[] = [];

  try {
    const [productData, productGroupData, chipSizeData] = await Promise.all([
      db.product.findUnique({
        where: { id: productId },
        include: { productVariants: true, prices: true },
      }),
      db.productGroup.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      }),
      db.chipSize.findMany({
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    productGroups = productGroupData;
    chipSizes = chipSizeData;
    product = productData;
    prices = productData?.prices ?? [];
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
            chipSizes={chipSizes}
            chipSizeId={product.chipSizeId ?? undefined}
            displayOrder={product.displayOrder ?? undefined}
            length_mm={product.length_mm}
            width_mm={product.width_mm}
            thickness_mm={product.thickness_mm}
            productVariants={product.productVariants ?? undefined}
            prices={prices}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
