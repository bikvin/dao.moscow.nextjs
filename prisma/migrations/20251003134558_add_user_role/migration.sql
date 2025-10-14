-- CreateEnum
CREATE TYPE "UserRoleEnum" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRoleEnum" NOT NULL DEFAULT 'USER';
