-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "chipSizeId" TEXT;

-- CreateTable
CREATE TABLE "ChipSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChipSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChipSize_name_key" ON "ChipSize"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_chipSizeId_fkey" FOREIGN KEY ("chipSizeId") REFERENCES "ChipSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
