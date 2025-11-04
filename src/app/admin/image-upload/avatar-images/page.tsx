import { TopMenu } from "@/components/admin/topMenu/TopMenu";

import { EditImagesForm } from "@/components/admin/images/edit/editImagesForm";
import { db } from "@/db";

export default async function AvatarImagesEditPage() {
  const IMAGE_GROUP = "avatar";

  const avatarImages = await db.imageGroupArray.findUnique({
    where: { imageGroupName: IMAGE_GROUP },
  });

  const SELECTED_IMAGES = 1;
  const MAX_IMAGES = 10;

  const arrString = avatarImages ? avatarImages.fileNamesArr : "[]";

  const avatarImagesData = JSON.parse(arrString);

  return (
    <>
      <TopMenu />
      <div className="max-w-screen-lg mx-auto ">
        <div className={`adminFormContainer w-[80%] mx-auto`}>
          <h1 className="admin-form-header mt-10">Фото для аватара</h1>
          <EditImagesForm
            imageData={avatarImagesData}
            imageGroup={IMAGE_GROUP}
            selectedImages={SELECTED_IMAGES}
            maxImages={MAX_IMAGES}
          />
        </div>
      </div>
    </>
  );
}
