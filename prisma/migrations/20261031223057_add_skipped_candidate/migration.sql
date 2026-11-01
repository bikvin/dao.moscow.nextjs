-- CreateEnum
CREATE TYPE "SkippedCandidateSource" AS ENUM ('OZON_ORDER', 'OZON_RETURN', 'YANDEX_ORDER', 'YANDEX_RETURN');

-- CreateTable
CREATE TABLE "SkippedCandidate" (
    "id" TEXT NOT NULL,
    "source" "SkippedCandidateSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkippedCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkippedCandidate_source_idx" ON "SkippedCandidate"("source");

-- CreateIndex
CREATE UNIQUE INDEX "SkippedCandidate_source_externalId_key" ON "SkippedCandidate"("source", "externalId");
