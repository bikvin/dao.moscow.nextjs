-- CreateEnum
CREATE TYPE "ProductReceiptTypeEnum" AS ENUM ('SHIPMENT', 'CORRECTION');

-- CreateEnum
CREATE TYPE "ProductIssueEnum" AS ENUM ('SALE', 'CORRECTION');

-- CreateTable
CREATE TABLE "ProductReceipt" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "type" "ProductReceiptTypeEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIssue" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "type" "ProductIssueEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductIssue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductReceipt" ADD CONSTRAINT "ProductReceipt_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIssue" ADD CONSTRAINT "ProductIssue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
