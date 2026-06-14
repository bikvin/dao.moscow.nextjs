-- CreateTable
CREATE TABLE "YandexReturnData" (
    "id" TEXT NOT NULL,
    "yandexReturnId" TEXT NOT NULL,
    "yandexOrderId" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "refundStatus" TEXT,
    "shipmentStatus" TEXT,
    "buyerRefundRub" INTEGER NOT NULL DEFAULT 0,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "YandexReturnData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YandexReturnData_yandexReturnId_key" ON "YandexReturnData"("yandexReturnId");

-- CreateIndex
CREATE UNIQUE INDEX "YandexReturnData_orderId_key" ON "YandexReturnData"("orderId");

-- AddForeignKey
ALTER TABLE "YandexReturnData" ADD CONSTRAINT "YandexReturnData_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
