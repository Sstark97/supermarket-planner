-- US06: add stable composite identifier and enforce idempotent deduplication
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;

UPDATE "Product"
SET "sku" = COALESCE(
  NULLIF(lower(trim("url")), ''),
  concat(
    'name:', regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'),
    '|unit:', regexp_replace(lower("unit"), '[^a-z0-9]+', '-', 'g'),
    '|category:', regexp_replace(lower("category"), '[^a-z0-9]+', '-', 'g')
  )
)
WHERE "sku" IS NULL;

WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "supermarket", "sku"
      ORDER BY "scrapedAt" DESC, "id" DESC
    ) AS rn
  FROM "Product"
)
DELETE FROM "Product"
WHERE "id" IN (
  SELECT "id" FROM ranked WHERE rn > 1
);

ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "Product_supermarket_sku_key" ON "Product"("supermarket", "sku");
