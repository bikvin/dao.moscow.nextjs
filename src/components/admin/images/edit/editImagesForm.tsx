"use client";
import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton/formButton";

import { useState } from "react";
// import { EditParallaxImages } from "@/actions/parallax-images/edit/editParallaxImages";
import { EditImagesAction } from "@/actions/images/edit/editImagesAction";
import DropzoneInputMultipleImages from "@/components/admin/images/dropzone/dropzoneInputMultipleImages";
import { ImageObj } from "./ImageObjInterface";

export function EditImagesForm({
  imageData,
  imageGroup,
  selectedImages = null,
  maxImages = null,
}: {
  imageData: ImageObj[];
  imageGroup: string;
  selectedImages?: number | null;
  maxImages?: number | null;
}) {
  const [formState, action] = useFormState(EditImagesAction, {
    errors: {},
  });

  const successMessage = formState.success ? formState.success.message : null;

  const [photoNames, setPhotoNames] = useState(imageData);

  return (
    <form className={`adminForm mb-10`} action={action}>
      <div>
        <DropzoneInputMultipleImages
          photoNames={photoNames}
          setPhotoNames={setPhotoNames}
          dirName={`${imageGroup}-images`}
          selectedImages={selectedImages}
          maxImages={maxImages}
        />
      </div>

      {formState.errors && (
        <div className="error">{formState.errors?._form?.join(", ")}</div>
      )}
      {formState.errors && (
        <div className="error">
          {formState.errors?.imagesArrString?.join(", ")}
        </div>
      )}
      {formState.errors && (
        <div className="error">{formState.errors?.imageGroup?.join(", ")}</div>
      )}

      <input
        type="hidden"
        name="imagesArrString"
        value={JSON.stringify(photoNames)}
      />

      <input type="hidden" name="imageGroup" value={imageGroup} />

      <FormButton successMessage={successMessage}>Сохранить</FormButton>
    </form>
  );
}
