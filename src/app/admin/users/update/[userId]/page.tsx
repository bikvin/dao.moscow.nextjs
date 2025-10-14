import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import UserForm from "@/components/admin/user/userForm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function UpdateUserPage({
  params,
}: {
  params: { userId: string };
}) {
  await requireAdmin();

  const userId = params.userId;
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    return <div>Пользователь с таким id не найден</div>;
  }

  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">
            Редактировать пользователя
          </h1>
          <UserForm
            userName={user.name}
            email={user.email}
            id={user.id}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
