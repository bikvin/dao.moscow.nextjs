-- CreateTable
CREATE TABLE "ImageGroupArray" (
    "id" TEXT NOT NULL,
    "imageGroupName" TEXT NOT NULL,
    "fileNamesArr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageGroupArray_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageGroupArray_imageGroupName_key" ON "ImageGroupArray"("imageGroupName");
