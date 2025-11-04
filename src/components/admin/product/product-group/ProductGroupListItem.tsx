import React from "react";
import { ProductGroup } from "@prisma/client";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import { deleteProductGroup } from "@/actions/product/product-group/delete";

export function ProductGroupListListItem({ item }: { item: ProductGroup }) {
  return (
    <div className="relative flex flex-col border rounded-md mb-4 p-2 shadow-main">
      <div className="absolute top-4 right-4 flex gap-2 flex-col">
        <DeleteDialog
          id={item.id}
          action={deleteProductGroup}
          message={`Вы уверены, что хотите удалить группу ${item.name}`}
        />
        <Link
          className=""
          href={`/admin/products/product-groups/update/${item.id}`}
        >
          <RiEdit2Line className="w-6 h-6 hover:text-blue-700 hover:scale-125 cursor-pointer" />
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-start items-center">
        <div className="p-4">
          <h4 className="text-2xl">{item.name}</h4>
          <div className="mt-4 text-gray-400 text-sm">{`Порядок показа ${item.displayOrder}`}</div>
        </div>
      </div>
    </div>
  );
}
