-- CreateTable
CREATE TABLE "SampleType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PartnerAddressToSampleType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartnerAddressToSampleType_AB_pkey" PRIMARY KEY ("A","B")
);

-- DropColumn
ALTER TABLE "Partner" DROP COLUMN IF EXISTS "samplesTypes";

-- CreateIndex
CREATE UNIQUE INDEX "SampleType_name_key" ON "SampleType"("name");

-- CreateIndex
CREATE INDEX "_PartnerAddressToSampleType_B_index" ON "_PartnerAddressToSampleType"("B");

-- AddForeignKey
ALTER TABLE "_PartnerAddressToSampleType" ADD CONSTRAINT "_PartnerAddressToSampleType_A_fkey" FOREIGN KEY ("A") REFERENCES "PartnerAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerAddressToSampleType" ADD CONSTRAINT "_PartnerAddressToSampleType_B_fkey" FOREIGN KEY ("B") REFERENCES "SampleType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
