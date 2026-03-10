-- CreateEnum
CREATE TYPE "OzonSyncStatusEnum" AS ENUM ('SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "OzonMapping" (
    "id" TEXT NOT NULL,
    "ozonOfferId" TEXT NOT NULL,
    "buffer" INTEGER,
    "divisor" INTEGER,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OzonMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OzonSyncLog" (
    "id" TEXT NOT NULL,
    "status" "OzonSyncStatusEnum" NOT NULL,
    "trigger" TEXT NOT NULL,
    "message" TEXT,
    "skuCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OzonSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OzonMapping_ozonOfferId_key" ON "OzonMapping"("ozonOfferId");

-- CreateIndex
CREATE INDEX "OzonMapping_productId_idx" ON "OzonMapping"("productId");

-- AddForeignKey
ALTER TABLE "OzonMapping" ADD CONSTRAINT "OzonMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
