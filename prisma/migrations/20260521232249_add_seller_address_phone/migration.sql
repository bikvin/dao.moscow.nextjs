-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "sellerAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sellerPhone" TEXT NOT NULL DEFAULT '';
