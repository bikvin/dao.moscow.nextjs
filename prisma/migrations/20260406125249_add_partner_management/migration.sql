-- CreateEnum
CREATE TYPE "PartnerStatusEnum" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AddressTypeEnum" AS ENUM ('SHOP', 'OFFICE');

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "status" "PartnerStatusEnum" NOT NULL DEFAULT 'PROSPECT',
    "prospectNotes" TEXT,
    "samplesTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerName" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerPhone" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerWebsite" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerWebsite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerAddress" (
    "id" TEXT NOT NULL,
    "type" "AddressTypeEnum" NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLegalEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inn" TEXT,
    "kpp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerLegalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerContactPerson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CityToPartner" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CityToPartner_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PartnerToTransportCompany" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartnerToTransportCompany_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TransportCompany_name_key" ON "TransportCompany"("name");

-- CreateIndex
CREATE INDEX "PartnerName_partnerId_idx" ON "PartnerName"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerEmail_partnerId_idx" ON "PartnerEmail"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerPhone_partnerId_idx" ON "PartnerPhone"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerWebsite_partnerId_idx" ON "PartnerWebsite"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerAddress_partnerId_idx" ON "PartnerAddress"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerLegalEntity_partnerId_idx" ON "PartnerLegalEntity"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerContactPerson_partnerId_idx" ON "PartnerContactPerson"("partnerId");

-- CreateIndex
CREATE INDEX "_CityToPartner_B_index" ON "_CityToPartner"("B");

-- CreateIndex
CREATE INDEX "_PartnerToTransportCompany_B_index" ON "_PartnerToTransportCompany"("B");

-- AddForeignKey
ALTER TABLE "PartnerName" ADD CONSTRAINT "PartnerName_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerEmail" ADD CONSTRAINT "PartnerEmail_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerPhone" ADD CONSTRAINT "PartnerPhone_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerWebsite" ADD CONSTRAINT "PartnerWebsite_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerAddress" ADD CONSTRAINT "PartnerAddress_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLegalEntity" ADD CONSTRAINT "PartnerLegalEntity_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerContactPerson" ADD CONSTRAINT "PartnerContactPerson_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToPartner" ADD CONSTRAINT "_CityToPartner_A_fkey" FOREIGN KEY ("A") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToPartner" ADD CONSTRAINT "_CityToPartner_B_fkey" FOREIGN KEY ("B") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerToTransportCompany" ADD CONSTRAINT "_PartnerToTransportCompany_A_fkey" FOREIGN KEY ("A") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerToTransportCompany" ADD CONSTRAINT "_PartnerToTransportCompany_B_fkey" FOREIGN KEY ("B") REFERENCES "TransportCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
