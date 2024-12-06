import UserForm from "@/components/user/userForm";

export default function UserCreatePage() {
  return (
    <>
      <div className={`card w-1/2 mt-10 mx-auto`}>
        <h1 className="admin-form-header">Создать пользователя</h1>
        <UserForm />
      </div>
    </>
  );
}
