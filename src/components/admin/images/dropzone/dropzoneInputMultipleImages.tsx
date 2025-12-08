"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";

import SortableImages from "@/components/admin/images/dropzone/sortableImages/sortableImages";
import { v4 as uuidv4 } from "uuid";
import { ImageObj } from "../edit/ImageObjInterface";
import { loadToS3 } from "@/lib/awsS3/loadToS3";
import clsx from "clsx";

// const DIR_NAME = "parallax-images";

export default function DropzoneInputMultipleImages({
  photoNames,
  setPhotoNames,
  dirName,
  selectedImages,
  maxImages,
}: {
  photoNames: ImageObj[];
  setPhotoNames: React.Dispatch<React.SetStateAction<ImageObj[]>>;
  dirName: string;
  selectedImages: number | null;
  maxImages: number | null;
}) {
  const [isUploadingFilesNumber, setIsUploadingFilesNumber] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);

  const [customRejections, setCustomRejections] = useState<
    { file: File; errors: { code: string; message: string }[] }[]
  >([]);

  const addNewFile = (fileName: string) => {
    setPhotoNames((prevPhotoNames) => [
      ...prevPhotoNames,
      {
        name: fileName,
        id: uuidv4(),
      },
    ]);
  };

  const changeOrder = (newArr: ImageObj[]) => {
    setPhotoNames(newArr);
  };

  const deleteFile = (id: string) => {
    setIsDeleting(true);

    setPhotoNames((prevPhotoNames) => {
      const newPhotoNames = prevPhotoNames.filter(
        (photoName) => photoName.id !== id
      );

      return newPhotoNames;
    });
  };

  const onDrop = useCallback(
    (autoAcceptedFiles: File[]) => {
      const newCustomRejections: typeof customRejections = [];

      if (maxImages && photoNames.length >= maxImages) {
        autoAcceptedFiles.forEach((file, index) => {
          newCustomRejections.push({
            file: autoAcceptedFiles[index],
            errors: [
              {
                code: "too-many-files",
                message: `Cлишком много файлов загружено. Максимум - ${maxImages}. Нужно сначала удалить лишние.`,
              },
            ],
          });
        });

        setCustomRejections(newCustomRejections);

        return;
      }

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

      setIsUploadingFilesNumber(filteredAccepted.length);
      filteredAccepted.forEach((file) => {
        const reader = new FileReader();

        reader.onerror = () => console.log("file reading has failed");
        reader.onload = async () => {
          let data;

          try {
            data = await loadToS3(file, dirName);
          } catch (error) {
            console.log(error);
            setIsUploadingFilesNumber(0);
          }

          addNewFile(data.fileName);

          setIsUploadingFilesNumber(0);
        };
        reader.readAsArrayBuffer(file);
      });

      setCustomRejections(newCustomRejections);
    },
    [photoNames, maxImages, dirName]
  );

  const {
    // acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,

    maxSize: 1024 * 1024, // 1 MB in bytes
  });

  const classes = clsx(
    "border-2 border-dashed rounded-lg text-center p-8 cursor-pointer", // always applied
    isDragAccept && "border-green-800 bg-green-100", // only if true
    isDragReject && "border-red-800 bg-red-100", // only if true
    !isDragAccept && !isDragReject && "border-zinc-400 bg-white" // default fallback
  );

  return (
    <section className="container">
      <div
        {...getRootProps({
          className: classes,
        })}
      >
        {/* <input {...getInputProps()} /> */}
        <p>Выберите файл или перетащите сюда.</p>
      </div>
      <input
        {...getInputProps({
          onClick: () => console.log("file input clicked"),
        })}
      />

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

      <div>
        <SortableImages
          isUploadingFilesNumber={isUploadingFilesNumber}
          photoNames={photoNames}
          changeOrder={changeOrder}
          deleteFile={deleteFile}
          isDeleting={isDeleting}
          setIsDeleting={setIsDeleting}
          dirName={dirName}
          selectedImages={selectedImages}
        />
      </div>
    </section>
  );
}
