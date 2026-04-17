-- CreateTable
CREATE TABLE "PartnerTransportCompany" (
    "id" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerId" TEXT NOT NULL,
    "transportCompanyId" TEXT NOT NULL,

    CONSTRAINT "PartnerTransportCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerTransportCompany_partnerId_idx" ON "PartnerTransportCompany"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerTransportCompany_partnerId_transportCompanyId_key" ON "PartnerTransportCompany"("partnerId", "transportCompanyId");

-- AddForeignKey
ALTER TABLE "PartnerTransportCompany" ADD CONSTRAINT "PartnerTransportCompany_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTransportCompany" ADD CONSTRAINT "PartnerTransportCompany_transportCompanyId_fkey" FOREIGN KEY ("transportCompanyId") REFERENCES "TransportCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CopyData
INSERT INTO "PartnerTransportCompany" ("id", "partnerId", "transportCompanyId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "A", "B", now(), now()
FROM "_PartnerToTransportCompany";

-- DropForeignKey
ALTER TABLE "_PartnerToTransportCompany" DROP CONSTRAINT "_PartnerToTransportCompany_A_fkey";

-- DropForeignKey
ALTER TABLE "_PartnerToTransportCompany" DROP CONSTRAINT "_PartnerToTransportCompany_B_fkey";

-- DropTable
DROP TABLE "_PartnerToTransportCompany";
