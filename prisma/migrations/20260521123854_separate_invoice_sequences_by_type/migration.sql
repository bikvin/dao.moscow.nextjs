/*
  Warnings:

  - A unique constraint covering the columns `[year,invoiceType,sequenceNumber]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Invoice_year_sequenceNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_year_invoiceType_sequenceNumber_key" ON "Invoice"("year", "invoiceType", "sequenceNumber");
