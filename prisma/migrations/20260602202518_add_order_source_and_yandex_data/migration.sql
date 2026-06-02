-- CreateEnum
CREATE TYPE "OrderSourceEnum" AS ENUM ('MANUAL', 'YANDEX', 'OZON');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "source" "OrderSourceEnum" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "YandexOrderData" (
    "id" TEXT NOT NULL,
    "yandexOrderId" TEXT NOT NULL,
    "buyerTotal" INTEGER NOT NULL,
    "feeRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expressDeliveryRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "crossDeliveryRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentTransferRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agencyRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loyaltyFeeRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortingRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "YandexOrderData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YandexOrderData_yandexOrderId_key" ON "YandexOrderData"("yandexOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "YandexOrderData_orderId_key" ON "YandexOrderData"("orderId");

-- AddForeignKey
ALTER TABLE "YandexOrderData" ADD CONSTRAINT "YandexOrderData_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
