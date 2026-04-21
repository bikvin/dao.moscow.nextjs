-- CreateEnum
CREATE TYPE "VariantStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "status" "VariantStatusEnum" NOT NULL DEFAULT 'ACTIVE';
