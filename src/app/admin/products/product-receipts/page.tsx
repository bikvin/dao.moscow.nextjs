import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import Link from "next/link";

import { db } from "@/db";

import { ProductReceiptWithProductVariant } from "@/types/product/productReceipt/productReceiptWithProductVariant";
import ProductReceiptsList from "@/components/admin/product/product-receipt/ProductReceipsList";

export default async function AllProductReciptsPage() {
  let productReceipts: ProductReceiptWithProductVariant[];

  try {
    const [productReceiptData] = await Promise.all([
      db.productReceipt.findMany({
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
        orderBy: [{ receiptDate: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    if (!productReceiptData) {
      return <div className="text-red-800">Данные не найдены.</div>;
    }

    productReceipts = productReceiptData;
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Все приходы товаров</h1>
          <div className=" mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/product-receipts/create"
            >
              Создать приход
            </Link>
          </div>

          <ProductReceiptsList itemsData={productReceipts} />
        </div>
      </div>
    </>
  );
}
