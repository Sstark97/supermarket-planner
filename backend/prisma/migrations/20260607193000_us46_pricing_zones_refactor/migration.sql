-- CreateTable
CREATE TABLE "PricingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PricingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostalCode" (
    "code" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,

    CONSTRAINT "PostalCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "PricingZone_name_idx" ON "PricingZone"("name");

-- CreateIndex
CREATE INDEX "PostalCode_zoneId_idx" ON "PostalCode"("zoneId");

-- Seed zones from existing ProductPrice.postalCode values
INSERT INTO "PricingZone" ("id", "name")
SELECT DISTINCT
    CONCAT('postal-', "postalCode") AS "id",
    CONCAT('Postal code ', "postalCode") AS "name"
FROM "ProductPrice";

INSERT INTO "PostalCode" ("code", "zoneId")
SELECT DISTINCT
    "postalCode" AS "code",
    CONCAT('postal-', "postalCode") AS "zoneId"
FROM "ProductPrice"
ON CONFLICT ("code") DO NOTHING;

-- Add zoneId to ProductPrice and backfill it from PostalCode mapping
ALTER TABLE "ProductPrice" ADD COLUMN "zoneId" TEXT;

UPDATE "ProductPrice" AS product_price
SET "zoneId" = postal_codes."zoneId"
FROM "PostalCode" AS postal_codes
WHERE product_price."postalCode" = postal_codes."code";

-- Make zoneId required
ALTER TABLE "ProductPrice" ALTER COLUMN "zoneId" SET NOT NULL;

-- Replace unique and index from postalCode to zoneId
DROP INDEX IF EXISTS "ProductPrice_productId_postalCode_key";
DROP INDEX IF EXISTS "ProductPrice_postalCode_idx";

CREATE UNIQUE INDEX "ProductPrice_productId_zoneId_key" ON "ProductPrice"("productId", "zoneId");
CREATE INDEX "ProductPrice_zoneId_idx" ON "ProductPrice"("zoneId");

-- Add foreign keys
ALTER TABLE "PostalCode"
ADD CONSTRAINT "PostalCode_zoneId_fkey"
FOREIGN KEY ("zoneId") REFERENCES "PricingZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductPrice"
ADD CONSTRAINT "ProductPrice_zoneId_fkey"
FOREIGN KEY ("zoneId") REFERENCES "PricingZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old postalCode column in ProductPrice
ALTER TABLE "ProductPrice" DROP COLUMN "postalCode";
