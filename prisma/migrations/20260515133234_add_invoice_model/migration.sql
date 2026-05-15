-- CreateEnum
CREATE TYPE "InvoiceTypeEnum" AS ENUM ('CASH', 'BANK');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "invoiceType" "InvoiceTypeEnum" NOT NULL DEFAULT 'CASH',
    "deliveryPriceRub" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRub" INTEGER NOT NULL DEFAULT 0,
    "sellerLegalName" TEXT NOT NULL DEFAULT '',
    "sellerInn" TEXT NOT NULL DEFAULT '',
    "sellerKpp" TEXT NOT NULL DEFAULT '',
    "sellerBankName" TEXT NOT NULL DEFAULT '',
    "sellerShortBankName" TEXT NOT NULL DEFAULT '',
    "sellerBik" TEXT NOT NULL DEFAULT '',
    "sellerBankAccNo" TEXT NOT NULL DEFAULT '',
    "sellerAccNo" TEXT NOT NULL DEFAULT '',
    "buyerLegalName" TEXT NOT NULL DEFAULT '',
    "buyerInn" TEXT NOT NULL DEFAULT '',
    "buyerKpp" TEXT NOT NULL DEFAULT '',
    "buyerBankName" TEXT NOT NULL DEFAULT '',
    "buyerBik" TEXT NOT NULL DEFAULT '',
    "buyerBankAccNo" TEXT NOT NULL DEFAULT '',
    "buyerAccNo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "orderId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityM2" DOUBLE PRECISION,
    "priceUnit" "PriceUnitEnum" NOT NULL DEFAULT 'M2',
    "priceRub" INTEGER NOT NULL,
    "totalRub" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_partnerId_idx" ON "Invoice"("partnerId");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_year_sequenceNumber_key" ON "Invoice"("year", "sequenceNumber");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
