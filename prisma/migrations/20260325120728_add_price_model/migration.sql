-- CreateEnum
CREATE TYPE "CurrencyEnum" AS ENUM ('RUB', 'USD', 'RMB');

-- CreateEnum
CREATE TYPE "PriceTypeEnum" AS ENUM ('DEALER', 'RETAIL', 'YANDEX', 'OZON');

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "type" "PriceTypeEnum" NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "currency" "CurrencyEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Price_productId_idx" ON "Price"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Price_productId_type_key" ON "Price"("productId", "type");

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
