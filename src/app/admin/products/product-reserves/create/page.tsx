import { ProductReserveForm } from "@/components/admin/product/product-reserve/ProductReserveForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ProductWithVariants } from "@/types/product/productWithVariants";

export default async function CreateProductReservePage({
  searchParams,
}: {
  searchParams: { productId?: string };
}) {
  const preselectedProductId = searchParams.productId;

  let products: ProductWithVariants[];

  try {
    const data = await db.product.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        productVariants: true,
      },
    });

    if (!data) {
      return <div className="text-red-800">Данные не найдены.</div>;
    }

    products = data;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Создать резерв</h1>
          <ProductReserveForm
            products={products}
            productId={preselectedProductId}
          />
        </div>
      </div>
    </>
  );
}
