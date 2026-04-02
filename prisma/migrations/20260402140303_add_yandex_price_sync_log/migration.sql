-- CreateTable
CREATE TABLE "YandexPriceSyncLog" (
    "id" TEXT NOT NULL,
    "status" "YandexSyncStatusEnum" NOT NULL,
    "trigger" TEXT NOT NULL,
    "message" TEXT,
    "skuCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YandexPriceSyncLog_pkey" PRIMARY KEY ("id")
);
