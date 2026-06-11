-- CreateTable
CREATE TABLE "OzonOrderData" (
    "id" TEXT NOT NULL,
    "postingNumber" TEXT NOT NULL,
    "buyerPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logisticsRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dropoffRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastMileRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "starsMembershipRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acquiringRub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feesSettled" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OzonOrderData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OzonOrderData_postingNumber_key" ON "OzonOrderData"("postingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OzonOrderData_orderId_key" ON "OzonOrderData"("orderId");

-- AddForeignKey
ALTER TABLE "OzonOrderData" ADD CONSTRAINT "OzonOrderData_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
