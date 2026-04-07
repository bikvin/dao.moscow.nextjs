import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { CreatePartnerForm } from "@/components/admin/partner/CreatePartnerForm";

export default function CreatePartnerPage() {
  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Добавить партнёра</h1>
          <CreatePartnerForm />
        </div>
      </div>
    </>
  );
}
