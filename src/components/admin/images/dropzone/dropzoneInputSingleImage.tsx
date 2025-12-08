"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";

import { v4 as uuidv4 } from "uuid";
import { ImageObj } from "../edit/ImageObjInterface";
import { loadToS3 } from "@/lib/awsS3/loadToS3";
import clsx from "clsx";
import { SortableItem } from "./sortableImages/sortableImagesItem";
import { BiLoaderAlt } from "react-icons/bi";

export default function DropzoneInputSingleImage({
  photoName,
  setPhotoName,
  dirName,
}: {
  photoName: ImageObj | null;
  setPhotoName: React.Dispatch<React.SetStateAction<ImageObj | null>>;
  dirName: string;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const [customRejections, setCustomRejections] = useState<
    { file: File; errors: { code: string; message: string }[] }[]
  >([]);

  const addNewFile = (fileName: string) => {
    setPhotoName({
      name: fileName,
      id: uuidv4(),
    });
  };

  const deleteFile = () => {
    setPhotoName(null);
  };

  const onDrop = useCallback((autoAcceptedFiles: File[]) => {
    const newCustomRejections: typeof customRejections = [];

    if (autoAcceptedFiles.length == 0) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    autoAcceptedFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        newCustomRejections.push({
          file,
          errors: [
            { code: "file-invalid-type", message: "Неверный формат файла" },
          ],
        });
      }
    });

    // Filter out manually rejected files from acceptedFiles
    const filteredAccepted = autoAcceptedFiles.filter(
      (file) => allowedTypes.includes(file.type) // only allowed types
    );

    setIsUploading(true);
    filteredAccepted.forEach((file) => {
      const reader = new FileReader();

      reader.onerror = () => console.log("file reading has failed");
      reader.onload = async () => {
        let data;

        try {
          data = await loadToS3(file, dirName);
        } catch (error) {
          console.error("Upload failed:", error);
        } finally {
          setIsUploading(false);
        }

        addNewFile(data.fileName);

        setIsUploading(false);
      };
      reader.readAsArrayBuffer(file);
    });

    setCustomRejections(newCustomRejections);
  }, []);

  const {
    // acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 1024 * 1024, // 1 MB in bytes
  });

  const classes = clsx(
    "border-2 border-dashed rounded-lg text-center p-8 cursor-pointer", // always applied
    isDragAccept && "border-green-800 bg-green-100", // only if true
    isDragReject && "border-red-800 bg-red-100", // only if true
    !isDragAccept && !isDragReject && "border-zinc-400 bg-white" // default fallback
  );

  return (
    <div>
      <div
        {...getRootProps({
          className: classes,
        })}
      >
        <input {...getInputProps()} />
        <p>Выберите файл или перетащите сюда.</p>
      </div>

      <ul>
        {[...fileRejections, ...customRejections].map((rejection, index) => (
          <li key={index} className="error">
            {rejection.file.name} –{" "}
            {rejection.errors.map((e) => {
              switch (e.code) {
                case "file-too-large":
                  return (
                    <span key={e.code}>
                      Файл слишком большой, максимум 1 МБ
                    </span>
                  );
                case "file-invalid-type":
                  return <span key={e.code}>Неверный формат файла</span>;

                default:
                  return <span key={e.code}>{e.message}</span>;
              }
            })}
          </li>
        ))}
      </ul>

      <div
        className={clsx(
          "flex justify-center gap-0 flex-wrap",
          (photoName || isUploading) && "p-5 pt-3"
        )}
      >
        {photoName && !isUploading && (
          <SortableItem
            id={photoName.id}
            name={photoName.name}
            deleteFile={deleteFile}
            disabled={false}
            dirName={dirName}
          />
        )}

        {isUploading && (
          <div className="flex items-center justify-center relative cursor-grab w-[160px] h-[120px] border border-slate-400 rounded-lg overflow-hidden bg-slate-50">
            <BiLoaderAlt className="inline-block h-8 w-8 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
