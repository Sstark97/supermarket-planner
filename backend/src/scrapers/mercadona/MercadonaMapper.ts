import { v4 as uuidv4 } from "uuid";
import type { IProduct } from "../../interfaces/IProduct";
import { categorize } from "../../utils/ProductCategorizer";
import {
	detectTaxType,
	normalizePricePerUnit,
} from "../../utils/PriceNormalizer";
import type { MercadonaApiProduct } from "./types";

interface MercadonaMapperDeps {
	categorizeFn?: (name: string) => Promise<IProduct["category"]>;
	uuidFn?: () => string;
	nowFn?: () => string;
	supermarketName?: string;
}

function getQuantityRaw(product: MercadonaApiProduct): string {
	const instructions = product.price_instructions;
	if (!instructions?.unit_size || !instructions.size_format) {
		return "1 ud";
	}

	return `${String(instructions.unit_size)} ${instructions.size_format}`;
}

function getPriceRaw(product: MercadonaApiProduct): string {
	const instructions = product.price_instructions;
	const price = instructions?.unit_price ?? instructions?.bulk_price ?? 0;
	return String(price);
}

export async function mapMercadonaProducts(
	products: MercadonaApiProduct[],
	deps: MercadonaMapperDeps = {},
): Promise<IProduct[]> {
	const categorizeFn = deps.categorizeFn ?? categorize;
	const uuidFn = deps.uuidFn ?? uuidv4;
	const nowFn = deps.nowFn ?? (() => new Date().toISOString());
	const supermarketName = deps.supermarketName ?? "Mercadona";

	return Promise.all(
		products.map(async (item) => {
			const normalized = normalizePricePerUnit(
				getPriceRaw(item),
				getQuantityRaw(item),
			);
			const name = item.display_name ?? "";
			const category = await categorizeFn(name);

			return {
				id: uuidFn(),
				name,
				supermarket: supermarketName,
				category,
				price: normalized.price,
				pricePerUnit: normalized.pricePerUnit,
				unit: normalized.unit,
				image: item.thumbnail ?? undefined,
				url: `https://tienda.mercadona.es/product/${item.id}`,
				taxType: detectTaxType("IGIC"),
				scrapedAt: nowFn(),
			} satisfies IProduct;
		}),
	);
}
