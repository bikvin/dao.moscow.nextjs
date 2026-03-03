import { ProductReceiptForm } from "@/components/admin/product/product-receipt/productReceiptForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { ProductWithVariants } from "@/types/product/productWithVariants";
import { ProductReceipt, ProductVariant } from "@prisma/client";

export default async function UpdateProductReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const productReceiptId = params.id;

  let products: ProductWithVariants[] = [];
  let productReceipt:
    | (ProductReceipt & { productVariant: ProductVariant })
    | null = null;

  try {
    const [productReceiptData, productsData] = await Promise.all([
      db.productReceipt.findUnique({
        where: { id: productReceiptId },
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
    productReceipt = productReceiptData;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  if (!productReceipt || !products) {
    return <div>Данные не найдены</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">
            Редактировать приход товара
          </h1>
          <ProductReceiptForm
            id={productReceipt.id}
            productId={productReceipt.productVariant.productId}
            productVariantId={productReceipt.productVariantId}
            products={products}
            quantity={productReceipt.quantity}
            description={productReceipt.description}
            receiptDate={productReceipt.receiptDate}
            receiptType={productReceipt.type}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
