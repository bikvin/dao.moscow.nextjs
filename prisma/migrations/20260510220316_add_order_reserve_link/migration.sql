-- AlterTable
ALTER TABLE "ProductReserve" ADD COLUMN     "orderId" TEXT;

-- CreateIndex
CREATE INDEX "ProductReserve_orderId_idx" ON "ProductReserve"("orderId");

-- AddForeignKey
ALTER TABLE "ProductReserve" ADD CONSTRAINT "ProductReserve_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
