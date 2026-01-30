import { ProductReceiptForm } from "@/components/admin/product/product-receipt/productReceiptForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { Product } from "@prisma/client";

export default async function CreateProductReceiptPage() {
  await requireAdmin();

  let products: Product[];

  try {
    const [productData] = await Promise.all([
      db.product.findMany({
        orderBy: [
          { displayOrder: "asc" }, // Primary sort by 'order' column
          { createdAt: "desc" }, // Secondary sort by 'createdAt' column
        ],
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
          <h1 className="admin-form-header mt-10">Добавить поставку</h1>
          {/* <UserForm /> */}
          <ProductReceiptForm products={products} />
        </div>
      </div>
    </>
  );
}
