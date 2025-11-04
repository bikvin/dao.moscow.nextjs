import ProductGroupForm from "@/components/admin/product/product-group/productGroupForm";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function CreateProductGroupPage() {
  await requireAdmin();

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Добавить группу товаров</h1>
          <ProductGroupForm />
        </div>
      </div>
    </>
  );
}
