import Header from "@/components/admin/topMenu/topMenu";
import UserForm from "@/components/user/userForm";
import { db } from "@/db";

export default async function EditUserPage() {
  const user = await db.user.findFirst();

  if (!user) {
    throw new Error("User not found");
  }

  return (
    <>
      <Header page="user" />
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
