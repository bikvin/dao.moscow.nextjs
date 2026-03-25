-- CreateEnum
CREATE TYPE "PriceUnitEnum" AS ENUM ('M2', 'ITEM');

-- AlterTable
ALTER TABLE "Price" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unit" "PriceUnitEnum" NOT NULL DEFAULT 'M2';
