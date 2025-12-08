import React from "react";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import { deleteProduct } from "@/actions/product/delete";
import { ProductWithGroup } from "@/types/product/productWithGroup";
import Image from "next/image";

export function ProductListItem({ item }: { item: ProductWithGroup }) {
  const dirName = item.imageGroupName;
  const imageFileName = JSON.parse(item.fileNamesArr)[0]?.name || null;
  console.log("imageFileName", imageFileName);

  return (
    <div className="relative flex flex-col border rounded-md mb-4 p-2 shadow-main">
      <div className="absolute top-4 right-4 flex gap-2 flex-col">
        <DeleteDialog
          id={item.id}
          action={deleteProduct}
          message={`Вы уверены, что хотите удалить товар ${item.sku}`}
        />
        <Link className="" href={`/admin/products/update/${item.id}`}>
          <RiEdit2Line className="w-6 h-6 hover:text-blue-700 hover:scale-125 cursor-pointer" />
        </Link>
      </div>

      <div className="flex ">
        <div className="w-[130px] h-[130px] overflow-hidden">
          {imageFileName && (
            <Image
              src={`${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_PROTOCOL}://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_LINK}/${dirName}/${imageFileName}`}
              alt=""
              width={320}
              height={320}
            />
          )}
        </div>
        <div className="flex flex-col md:flex-row justify-start items-center">
          <div className="p-4">
            <h4 className="text-2xl">{item.sku}</h4>
            <div>{item.productGroup?.name}</div>
            <div className="mt-4 text-red-400 text-sm">
              {item.status === "ACTIVE" ? "" : "Отменен"}
            </div>

            <div className="absolute bottom-1 right-1 text-gray-400 text-sm">{`Порядок показа ${item.displayOrder}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
