import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import UsersList from "@/components/admin/user/UsersList";
import Link from "next/link";

import { requireAdmin } from "@/lib/requireAdmin";

export default async function AllProductsPage() {
  await requireAdmin();

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Все товары</h1>
          <div className=" mt-10 flex justify-end">
            <Link
              className="link-button link-button-green"
              href="/admin/products/create"
            >
              Создать товар
            </Link>
          </div>
          {/* <UsersList /> */}
        </div>
      </div>
    </>
  );
}
