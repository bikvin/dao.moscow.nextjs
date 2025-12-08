"use client";

import { BiLoaderAlt } from "react-icons/bi";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableItem } from "./sortableImagesItem";
import { ImageObj } from "../../edit/ImageObjInterface";
import { Dispatch, SetStateAction } from "react";

export default function SortableImages({
  isUploadingFilesNumber,
  photoNames,
  changeOrder,
  deleteFile,
  isDeleting,
  setIsDeleting,
  dirName,
  selectedImages,
}: {
  isUploadingFilesNumber: number;
  photoNames: ImageObj[];
  changeOrder: (newArr: ImageObj[]) => void;
  deleteFile: (id: string) => void;
  isDeleting: boolean;
  setIsDeleting: Dispatch<SetStateAction<boolean>>;
  dirName: string;
  selectedImages: number | null;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    if (isDeleting) {
      setIsDeleting(false);
      return;
    }

    if (active.id !== over.id) {
      // setItems((items) => {
      const oldIndex = photoNames
        .map((photoName) => photoName.id)
        .indexOf(active.id as string);
      const newIndex = photoNames
        .map((photoName) => photoName.id)
        .indexOf(over.id as string);

      const newArr = arrayMove(photoNames, oldIndex, newIndex);

      changeOrder(newArr);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={photoNames} strategy={rectSortingStrategy}>
        <div className="mt-2 text-center text-sm ">
          Перетащите картинки в нужном порядке. Потом не забудьте нажать
          Сохранить.
        </div>
        <div className="flex justify-start items-center gap-0 flex-wrap p-5 pt-3 ">
          {photoNames.map((photoName, index) => {
            const highlighted = selectedImages ? index < selectedImages : false;
            return (
              <div
                key={photoName.id}
                className={`
          relative w-[160px] h-[160px] flex items-center justify-center
          ${highlighted ? "bg-orange-100 border-0 border-yellow-200" : ""}
        `}
              >
                <SortableItem
                  id={photoName.id}
                  name={photoName.name}
                  deleteFile={deleteFile}
                  disabled={false}
                  dirName={dirName}
                />
              </div>
            );
          })}

          {!!isUploadingFilesNumber &&
            Array.from({ length: isUploadingFilesNumber }).map((_, i) => (
              <div
                key={`uploading-${i}`}
                className="flex items-center justify-center w-[160px] h-[160px]"
              >
                <div className="flex items-center justify-center relative cursor-grab w-[130px] h-[130px] border border-slate-400 rounded-lg overflow-hidden bg-slate-50">
                  <BiLoaderAlt className="inline-block h-8 w-8 animate-spin" />
                </div>
              </div>
            ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
