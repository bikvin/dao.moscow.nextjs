/*
  Warnings:

  - Added the required column `status` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductStatusEnum" AS ENUM ('ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "displayOrder" INTEGER,
ADD COLUMN     "productGroupId" TEXT,
ADD COLUMN     "status" "ProductStatusEnum" NOT NULL,
ALTER COLUMN "descriptionShort" DROP NOT NULL,
ALTER COLUMN "descriptionLong" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProductGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER,

    CONSTRAINT "ProductGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
