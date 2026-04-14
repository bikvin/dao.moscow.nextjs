-- AlterTable
ALTER TABLE "PartnerAddress" ADD COLUMN     "shoppingMallId" TEXT;

-- CreateTable
CREATE TABLE "ShoppingMall" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingMall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingMall_name_key" ON "ShoppingMall"("name");

-- AddForeignKey
ALTER TABLE "PartnerAddress" ADD CONSTRAINT "PartnerAddress_shoppingMallId_fkey" FOREIGN KEY ("shoppingMallId") REFERENCES "ShoppingMall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
