-- CreateEnum
CREATE TYPE "ZoneOnboardingQueueState" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ZoneOnboardingQueue" (
    "id" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "requestedDay" TIMESTAMP(3) NOT NULL,
    "state" "ZoneOnboardingQueueState" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "requestedByUserId" TEXT,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneOnboardingQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZoneOnboardingQueue_postalCode_requestedDay_key" ON "ZoneOnboardingQueue"("postalCode", "requestedDay");

-- CreateIndex
CREATE INDEX "ZoneOnboardingQueue_state_requestedDay_idx" ON "ZoneOnboardingQueue"("state", "requestedDay");

-- CreateIndex
CREATE INDEX "ZoneOnboardingQueue_postalCode_idx" ON "ZoneOnboardingQueue"("postalCode");
