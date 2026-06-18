-- CreateTable
CREATE TABLE "OzonReturnData" (
    "id" TEXT NOT NULL,
    "postingNumber" TEXT NOT NULL,
    "ozonOrderId" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "payoutRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnLogisticFeeRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feesSettled" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OzonReturnData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OzonReturnData_postingNumber_key" ON "OzonReturnData"("postingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OzonReturnData_orderId_key" ON "OzonReturnData"("orderId");

-- AddForeignKey
ALTER TABLE "OzonReturnData" ADD CONSTRAINT "OzonReturnData_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
