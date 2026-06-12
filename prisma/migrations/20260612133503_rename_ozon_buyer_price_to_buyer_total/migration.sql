/*
  Warnings:

  - You are about to drop the column `buyerPrice` on the `OzonOrderData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OzonOrderData" DROP COLUMN "buyerPrice",
ADD COLUMN     "buyerTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
