-- AlterTable
ALTER TABLE "ProductReceipt" ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "priceCurrency" "CurrencyEnum",
ADD COLUMN     "priceUnit" "PriceUnitEnum",
ADD COLUMN     "quantityLeft" INTEGER NOT NULL DEFAULT 0;
