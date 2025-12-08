"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

import { RxCross2 } from "react-icons/rx";

export function SortableItem({
  id,
  name,
  deleteFile,
  disabled,
  dirName,
}: {
  id: string;
  name: string;
  deleteFile: (id: string) => void;
  disabled: boolean;
  dirName: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id, disabled: disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteClickHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    deleteFile(event.currentTarget.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "flex items-center justify-center relative cursor-grab w-[130px] h-[130px] border border-slate-400 rounded-lg overflow-hidden bg-slate-50"
      }
      {...attributes}
      {...listeners}
    >
      {
        <div key={id}>
          <Image
            src={`${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_PROTOCOL}://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_LINK}/${dirName}/${name}`}
            alt=""
            width={320}
            height={320}
          />
          <div
            className="absolute flex items-center justify-center rounded-full bg-white top-1 right-1 h-8 w-8 cursor-pointer border border-slate-400"
            onMouseDown={deleteClickHandler}
            id={id}
          >
            <RxCross2 className="w-6 h-6 hover:text-red-700 hover:scale-115 cursor-pointer" />
          </div>
        </div>
      }
    </div>
  );
}
