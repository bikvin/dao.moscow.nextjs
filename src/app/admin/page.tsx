import { TopMenu } from "@/components/admin/topMenu/TopMenu";

export default async function ProfilePage() {
  return (
    <>
      <TopMenu />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Админка</h1>
        </div>
      </div>
    </>
  );
}
