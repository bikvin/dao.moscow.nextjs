import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import UserForm from "@/components/admin/user/userForm";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function CreateProductPage() {
  await requireAdmin();

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Добавить товар</h1>
          <UserForm />
        </div>
      </div>
    </>
  );
}
