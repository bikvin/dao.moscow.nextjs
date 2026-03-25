import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import ChipSizeForm from "@/components/admin/product/chip-size/ChipSizeForm";

export default function CreateChipSizePage() {
  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Добавить размер чипа</h1>
          <ChipSizeForm />
        </div>
      </div>
    </>
  );
}
