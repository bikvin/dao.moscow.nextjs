-- CreateEnum
CREATE TYPE "YandexSyncStatusEnum" AS ENUM ('SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "YandexMarketMapping" (
    "id" TEXT NOT NULL,
    "yandexSku" TEXT NOT NULL,
    "buffer" INTEGER,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YandexMarketMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YandexSyncLog" (
    "id" TEXT NOT NULL,
    "status" "YandexSyncStatusEnum" NOT NULL,
    "trigger" TEXT NOT NULL,
    "message" TEXT,
    "skuCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YandexSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YandexMarketMapping_yandexSku_key" ON "YandexMarketMapping"("yandexSku");

-- CreateIndex
CREATE INDEX "YandexMarketMapping_productId_idx" ON "YandexMarketMapping"("productId");

-- AddForeignKey
ALTER TABLE "YandexMarketMapping" ADD CONSTRAINT "YandexMarketMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
