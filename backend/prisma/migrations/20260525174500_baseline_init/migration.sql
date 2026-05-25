-- Baseline migration (already present in existing dev database)
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supermarket" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "image" TEXT,
    "url" TEXT,
    "taxType" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_supermarket_idx" ON "Product"("supermarket");
