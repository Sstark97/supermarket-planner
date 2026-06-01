-- CreateTable
CREATE TABLE "ActiveCart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
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

    CONSTRAINT "ActiveCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveCart_userId_key" ON "ActiveCart"("userId");

-- CreateIndex
CREATE INDEX "ActiveCart_userId_idx" ON "ActiveCart"("userId");

-- CreateIndex
CREATE INDEX "ActiveCartItem_cartId_idx" ON "ActiveCartItem"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveCartItem_cartId_supermarket_productName_key" ON "ActiveCartItem"("cartId", "supermarket", "productName");

-- AddForeignKey
ALTER TABLE "ActiveCartItem" ADD CONSTRAINT "ActiveCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "ActiveCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
