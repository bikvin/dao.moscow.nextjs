-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "buyerAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "buyerPhone" TEXT NOT NULL DEFAULT '';
