-- CreateTable
CREATE TABLE "OzonPriceSyncLog" (
    "id" TEXT NOT NULL,
    "status" "OzonSyncStatusEnum" NOT NULL,
    "trigger" TEXT NOT NULL,
    "message" TEXT,
    "skuCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OzonPriceSyncLog_pkey" PRIMARY KEY ("id")
);
