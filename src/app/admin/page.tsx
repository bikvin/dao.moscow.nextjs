import Header from "@/components/admin/topMenu/topMenu";

export default async function AdminPage() {
  return (
    <>
      <Header page="main" />

      <div className="max-w-screen-lg mx-auto ">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Админка</h1>
        </div>
      </div>
    </>
  );
}
