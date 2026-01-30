/*
  Warnings:

  - You are about to drop the column `warehouseQuantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `ProductIssue` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `ProductReceipt` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `ProductReserve` table. All the data in the column will be lost.
  - Added the required column `productVariantId` to the `ProductIssue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productVariantId` to the `ProductReceipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productVariantId` to the `ProductReserve` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductIssue" DROP CONSTRAINT "ProductIssue_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductReceipt" DROP CONSTRAINT "ProductReceipt_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductReserve" DROP CONSTRAINT "ProductReserve_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "warehouseQuantity";

-- AlterTable
ALTER TABLE "ProductIssue" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductReceipt" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductReserve" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "warehouseQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductIssue_productVariantId_idx" ON "ProductIssue"("productVariantId");

-- CreateIndex
CREATE INDEX "ProductReceipt_productVariantId_idx" ON "ProductReceipt"("productVariantId");

-- CreateIndex
CREATE INDEX "ProductReserve_productVariantId_idx" ON "ProductReserve"("productVariantId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReceipt" ADD CONSTRAINT "ProductReceipt_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIssue" ADD CONSTRAINT "ProductIssue_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReserve" ADD CONSTRAINT "ProductReserve_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
