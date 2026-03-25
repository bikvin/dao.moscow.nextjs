import { TopMenu } from "@/components/admin/topMenu/TopMenu";
import { db } from "@/db";
import { ChipSize } from "@prisma/client";
import Link from "next/link";
import { ChipSizeListItem } from "@/components/admin/product/chip-size/ChipSizeListItem";

export default async function ChipSizesPage() {
  let chipSizes: ChipSize[] = [];

  try {
    chipSizes = await db.chipSize.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  } catch (err) {
    console.log(err);
    return <div className="text-red-800">Ошибка при загрузке данных.</div>;
  }

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-[90%] md:w-2/3 mx-auto">
          <h1 className="admin-form-header mt-10">Размеры чипа</h1>
          <div className="mt-10 flex justify-end">
            <Link className="link-button link-button-green" href="/admin/products/chip-sizes/create">
              Добавить размер
            </Link>
          </div>
          <div className="mt-10">
            {chipSizes.length === 0 && (
              <div className="text-center text-xl font-light tracking-widest">
                Размеров чипа пока нет
              </div>
            )}
            {chipSizes.map((item) => (
              <ChipSizeListItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
