import { ProductReserveForm } from "@/components/admin/product/product-reserve/ProductReserveForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ProductWithVariants } from "@/types/product/productWithVariants";
import { ProductReserve, ProductVariant } from "@prisma/client";

export default async function UpdateProductReservePage({
  params,
}: {
  params: { id: string };
}) {
  const productReserveId = params.id;

  let products: ProductWithVariants[] = [];
  let productReserve:
    | (ProductReserve & { productVariant: ProductVariant })
    | null = null;

  try {
    const [productReserveData, productsData] = await Promise.all([
      db.productReserve.findUnique({
        where: { id: productReserveId },
        include: { productVariant: true },
      }),
      db.product.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        include: { productVariants: true },
      }),
    ]);

    products = productsData;
    productReserve = productReserveData;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  if (!productReserve) {
    return <div>Данные не найдены</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Редактировать резерв</h1>
          <ProductReserveForm
            id={productReserve.id}
            productId={productReserve.productVariant.productId}
            productVariantId={productReserve.productVariantId}
            products={products}
            quantity={productReserve.quantity}
            reserveDate={productReserve.reserveDate}
            client={productReserve.client}
            status={productReserve.status}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
