import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import ChipSizeForm from "@/components/admin/product/chip-size/ChipSizeForm";
import { db } from "@/db";

export default async function UpdateChipSizePage({
  params,
}: {
  params: { id: string };
}) {
  const chipSize = await db.chipSize.findUnique({ where: { id: params.id } });

  if (!chipSize) {
    return <div className="text-red-800">Размер чипа не найден.</div>;
  }

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Редактировать размер чипа</h1>
          <ChipSizeForm
            id={chipSize.id}
            name={chipSize.name}
            displayOrder={chipSize.displayOrder}
            isEdit={true}
          />
        </div>
      </div>
    </>
  );
}
