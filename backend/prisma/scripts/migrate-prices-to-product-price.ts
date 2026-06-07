/**
 * One-time / idempotent verification helper for US42.
 *
 * The actual data backfill runs inside the SQL migration
 * `prisma/migrations/20260607000000_us42_add_product_price/migration.sql`,
 * which inserts a `ProductPrice` row for every existing `Product` under the
 * default postal code "35001" BEFORE the legacy `price`/`pricePerUnit`/
 * `scrapedAt` columns are dropped from `Product`.
 *
 * By the time this script can run, those legacy columns no longer exist on
 * `Product` (they only live in `ProductPrice` now), so there is nothing left
 * to copy from. This script simply verifies that every `Product` row has a
 * corresponding `ProductPrice` row for the default postal code and reports
 * any product left without pricing data, so operators can investigate.
 *
 * Run with: pnpm tsx prisma/scripts/migrate-prices-to-product-price.ts
 */
import { PrismaClient } from "@prisma/client";

const DEFAULT_POSTAL_CODE = "35001";

class ProductPriceBackfillVerifier {
	constructor(private readonly prismaClient: PrismaClient) {}

	async run(): Promise<void> {
		const totalProductsCount = await this.prismaClient.product.count();
		const productsMissingDefaultPrice = await this.prismaClient.product.findMany({
			where: { prices: { none: { postalCode: DEFAULT_POSTAL_CODE } } },
			select: { id: true, name: true, supermarket: true, sku: true },
		});

		console.log(
			`[ProductPriceBackfillVerifier] Total products: ${totalProductsCount}. Products missing a ProductPrice for "${DEFAULT_POSTAL_CODE}": ${productsMissingDefaultPrice.length}`,
		);

		if (productsMissingDefaultPrice.length === 0) {
			console.log(
				"[ProductPriceBackfillVerifier] Verification passed -- every product has a ProductPrice row for the default postal code.",
			);
			return;
		}

		for (const product of productsMissingDefaultPrice) {
			console.warn(
				`[ProductPriceBackfillVerifier] Product "${product.id}" (${product.supermarket} / ${product.name} / sku=${product.sku}) has no ProductPrice for "${DEFAULT_POSTAL_CODE}". It must be re-scraped to recover pricing data -- the legacy columns no longer hold it.`,
			);
		}
	}
}

async function main(): Promise<void> {
	const prismaClient = new PrismaClient();
	try {
		await new ProductPriceBackfillVerifier(prismaClient).run();
	} finally {
		await prismaClient.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error("[ProductPriceBackfillVerifier] Failed:", error);
	process.exitCode = 1;
});
