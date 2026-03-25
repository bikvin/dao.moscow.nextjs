import { ChipSize } from "@prisma/client";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { deleteChipSize } from "@/actions/product/chip-size/delete";

export function ChipSizeListItem({ item }: { item: ChipSize }) {
  return (
    <div className="relative flex flex-col border rounded-md mb-4 p-2 shadow-main">
      <div className="absolute top-4 right-4 flex gap-2 flex-col">
        <DeleteDialog
          id={item.id}
          action={deleteChipSize}
          message={`Вы уверены, что хотите удалить размер чипа ${item.name}?`}
        />
        <Link href={`/admin/products/chip-sizes/update/${item.id}`}>
          <RiEdit2Line className="w-6 h-6 hover:text-blue-700 hover:scale-125 cursor-pointer" />
        </Link>
      </div>
      <div className="p-4">
        <h4 className="text-2xl">{item.name}</h4>
        <div className="mt-2 text-gray-400 text-sm">Порядок показа: {item.displayOrder ?? "—"}</div>
      </div>
    </div>
  );
}
