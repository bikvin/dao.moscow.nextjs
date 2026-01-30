-- CreateEnum
CREATE TYPE "ProductReserveStatusEnum" AS ENUM ('ACTIVE', 'FULFILLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ProductReserve" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reserveDate" TIMESTAMP(3) NOT NULL,
    "client" TEXT NOT NULL,
    "status" "ProductReserveStatusEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductReserve_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductReserve" ADD CONSTRAINT "ProductReserve_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
