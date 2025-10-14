import { db } from "@/db";
import UserForm from "@/components/admin/user/userForm";
import Link from "next/link";

export default async function FirstUserCreatePage() {
  try {
    // Check that there is no users in the db
    const existingUsersCount = await db.user.count();

    if (existingUsersCount > 0) {
      return (
        <>
          <div className={`card w-1/2 mt-10 mx-auto`}>
            <div className="text-3xl">
              <div>Первый пользователь уже создан.</div>
              <Link className="text-blue-500 hover:underline" href={"/login"}>
                Пожалуйста залогиньтесь.
              </Link>
            </div>
          </div>
        </>
      );
    }
  } catch (err) {
    console.log(err);
    return <div>Что-то пошло не так</div>;
  }

  return (
    <>
      <div className={`card w-1/2 mt-10 mx-auto`}>
        <h1 className="admin-form-header">Создать пользователя</h1>
        <UserForm />
      </div>
    </>
  );
}
