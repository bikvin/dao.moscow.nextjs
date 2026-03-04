import { ProductReceiptForm } from "@/components/admin/product/product-receipt/productReceiptForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ProductWithVariants } from "@/types/product/productWithVariants";

export default async function CreateProductReceiptPage({
  searchParams,
}: {
  searchParams: { productId?: string };
}) {
  const preselectedProductId = searchParams.productId;

  let products: ProductWithVariants[];

  try {
    const [productData] = await Promise.all([
      db.product.findMany({
        orderBy: [
          { displayOrder: "asc" }, // Primary sort by 'order' column
          { createdAt: "desc" }, // Secondary sort by 'createdAt' column
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
          <h1 className="admin-form-header mt-10">Добавить приход товара</h1>
          {/* <UserForm /> */}
          <ProductReceiptForm
            products={products}
            productId={preselectedProductId}
          />
        </div>
      </div>
    </>
  );
}
