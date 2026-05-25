import type { IProduct } from "../interfaces/IProduct";

function normalizeToken(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9:/._|-]/g, "");
}

/**
 * Builds a stable product identifier used for idempotent DB upserts.
 * Priority:
 * 1) canonical URL when available
 * 2) deterministic fallback from name/unit/category
 */
export function buildProductSku(
	product: Pick<IProduct, "name" | "supermarket" | "category" | "unit" | "url">,
): string {
	if (product.url && product.url.trim()) {
		return `url:${normalizeToken(product.url)}`;
	}

	const stableName = normalizeToken(product.name);
	const stableUnit = normalizeToken(product.unit);
	const stableCategory = normalizeToken(product.category);
	return `name:${stableName}|unit:${stableUnit}|category:${stableCategory}`;
}
