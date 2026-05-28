import type { MercadonaApiProduct } from "../../application/dto/ScraperPayloads";
import {
	defaultProductMapper,
	type ProductMapper,
} from "../../domain/services/ProductMappingPolicy";
import type { IProduct } from "../../interfaces/IProduct";
import { categorize } from "../../utils/ProductCategorizer";

interface MercadonaMapperDeps {
	productMapper?: ProductMapper;
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
	const supermarketName = deps.supermarketName ?? "Mercadona";
	const productMapper = deps.productMapper ?? defaultProductMapper;

	return Promise.all(
		products.map(async (item) => {
			const name = item.display_name ?? "";
			const category = await categorize(name);
			return productMapper.toDomain({
				supermarket: supermarketName,
				name,
				category,
				priceRaw: getPriceRaw(item),
				quantityRaw: getQuantityRaw(item),
				image: item.thumbnail ?? undefined,
				url: `https://tienda.mercadona.es/product/${item.id}`,
				taxHint: "IGIC",
			});
		}),
	);
}
