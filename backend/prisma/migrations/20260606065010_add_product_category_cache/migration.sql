-- CreateTable
CREATE TABLE "ProductCategoryCache" (
    "id" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategoryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategoryCache_normalizedName_key" ON "ProductCategoryCache"("normalizedName");

-- CreateIndex
CREATE INDEX "ProductCategoryCache_normalizedName_idx" ON "ProductCategoryCache"("normalizedName");
