import { auth } from "@/auth";
import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import UserForm from "@/components/admin/user/userForm";
import { db } from "@/db";

export default async function EditUserPage() {
  const session = await auth();

  const user = await db.user.findFirst({ where: { id: session?.user.id } });

  if (!user) {
    throw new Error("User not found");
  }

  return (
    <>
      <TopMenu />
      <div className={`card w-[90%] md:w-1/2 mt-10 mx-auto mb-10`}>
        <h1 className="admin-form-header">Редактировать пользователя</h1>
        <UserForm
          isEdit={true}
          userName={user.name}
          email={user.email}
          id={user.id}
        />
      </div>
    </>
  );
}
