-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('IN', 'OUT');

-- AlterEnum
ALTER TYPE "CurrencyEnum" ADD VALUE 'EUR';

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "currency" "CurrencyEnum" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashTransaction_date_idx" ON "CashTransaction"("date");

-- CreateIndex
CREATE INDEX "CashTransaction_currency_idx" ON "CashTransaction"("currency");
