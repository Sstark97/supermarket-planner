-- CreateTable
CREATE TABLE "ShoppingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shoppedAt" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingSessionItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "supermarket" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "image" TEXT,
    "url" TEXT,

    CONSTRAINT "ShoppingSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingSession_userId_idx" ON "ShoppingSession"("userId");

-- CreateIndex
CREATE INDEX "ShoppingSession_shoppedAt_idx" ON "ShoppingSession"("shoppedAt");

-- CreateIndex
CREATE INDEX "ShoppingSessionItem_sessionId_idx" ON "ShoppingSessionItem"("sessionId");

-- AddForeignKey
ALTER TABLE "ShoppingSessionItem" ADD CONSTRAINT "ShoppingSessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ShoppingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
