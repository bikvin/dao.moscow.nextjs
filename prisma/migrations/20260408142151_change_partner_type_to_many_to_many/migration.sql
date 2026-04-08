/*
  Warnings:

  - You are about to drop the column `partnerTypeId` on the `Partner` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Partner" DROP CONSTRAINT "Partner_partnerTypeId_fkey";

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "partnerTypeId";

-- CreateTable
CREATE TABLE "_PartnerToPartnerType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartnerToPartnerType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PartnerToPartnerType_B_index" ON "_PartnerToPartnerType"("B");

-- AddForeignKey
ALTER TABLE "_PartnerToPartnerType" ADD CONSTRAINT "_PartnerToPartnerType_A_fkey" FOREIGN KEY ("A") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerToPartnerType" ADD CONSTRAINT "_PartnerToPartnerType_B_fkey" FOREIGN KEY ("B") REFERENCES "PartnerType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
