-- CreateEnum
CREATE TYPE "OrderTypeEnum" AS ENUM ('SALE', 'RETURN');

-- CreateEnum
CREATE TYPE "OrderStatusEnum" AS ENUM ('ACTIVE', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatusEnum" AS ENUM ('DELIVERED', 'NOT_DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentStatusEnum" AS ENUM ('PAID', 'NOT_PAID');

-- AlterTable
ALTER TABLE "PartnerTransportCompany" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "DeliveryMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultPriceRub" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "orderType" "OrderTypeEnum" NOT NULL DEFAULT 'SALE',
    "status" "OrderStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "deliveryStatus" "DeliveryStatusEnum" NOT NULL DEFAULT 'NOT_DELIVERED',
    "paymentStatus" "PaymentStatusEnum" NOT NULL DEFAULT 'NOT_PAID',
    "deliveryDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "note" TEXT,
    "deliveryPriceRub" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRub" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "deliveryMethodId" TEXT,
    "paymentMethodId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityM2" DOUBLE PRECISION,
    "priceUnit" "PriceUnitEnum" NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "priceCurrency" "CurrencyEnum" NOT NULL,
    "priceRub" INTEGER NOT NULL,
    "totalRub" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryMethod_name_key" ON "DeliveryMethod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");

-- CreateIndex
CREATE INDEX "Order_partnerId_idx" ON "Order"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_year_sequenceNumber_key" ON "Order"("year", "sequenceNumber");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "DeliveryMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
