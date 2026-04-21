-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;

-- Set isMain = true for the earliest variant of each product
UPDATE "ProductVariant" pv
SET "isMain" = true
WHERE pv."createdAt" = (
  SELECT MIN(pv2."createdAt") FROM "ProductVariant" pv2 WHERE pv2."productId" = pv."productId"
);
