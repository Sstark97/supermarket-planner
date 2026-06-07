-- CreateTable
CREATE TABLE "ProductPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPrice_postalCode_idx" ON "ProductPrice"("postalCode");

-- CreateIndex
CREATE INDEX "ProductPrice_productId_idx" ON "ProductPrice"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPrice_productId_postalCode_key" ON "ProductPrice"("productId", "postalCode");

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: backfill existing Product prices into ProductPrice under the
-- default postal code "35001" BEFORE dropping the columns from Product.
-- This must run before the DROP COLUMN statements below or historical price
-- data would be permanently lost.
INSERT INTO "ProductPrice" ("id", "productId", "postalCode", "price", "pricePerUnit", "scrapedAt")
SELECT gen_random_uuid(), "id", '35001', "price", "pricePerUnit", "scrapedAt"
FROM "Product";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
DROP COLUMN "pricePerUnit",
DROP COLUMN "scrapedAt";
