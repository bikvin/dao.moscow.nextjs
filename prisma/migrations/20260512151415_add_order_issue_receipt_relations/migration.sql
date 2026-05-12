-- AlterTable
ALTER TABLE "ProductIssue" ADD COLUMN     "orderId" TEXT;

-- AlterTable
ALTER TABLE "ProductReceipt" ADD COLUMN     "orderId" TEXT;

-- CreateIndex
CREATE INDEX "ProductIssue_orderId_idx" ON "ProductIssue"("orderId");

-- CreateIndex
CREATE INDEX "ProductReceipt_orderId_idx" ON "ProductReceipt"("orderId");

-- AddForeignKey
ALTER TABLE "ProductReceipt" ADD CONSTRAINT "ProductReceipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIssue" ADD CONSTRAINT "ProductIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
