import { PlaywrightScraperAdapterBase } from "../PlaywrightScraperAdapterBase";
import type {
	AldiAlgoliaHit,
	AldiAlgoliaMultiQueryResponse,
} from "../../../../../application/dto/ScraperPayloads";
import {
	defaultProductMapper,
	type ProductMapper,
} from "../../../../../domain/services/ProductMappingPolicy";
import type { IProduct } from "../../../../../domain/entities/IProduct";
import { categorize } from "../../categorization/ProductCategorizer";
import { logger } from "../../../../logging/logger";

const ALDI_ALGOLIA_URL =
	"https://l9knu74io7-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.14.2)";
const ALDI_CANARY_INDICES = [
	"prod_es_es_can_offers",
	"prod_es_es_can_assortment",
] as const;
const ALDI_CANARY_STORE_IDS = [
	"ES005001",
	"ES005002",
	"ES005003",
	"ES005004",
	"ES005005",
	"ES005006",
	"ES005008",
	"ES005009",
	"ES005010",
	"ES005011",
	"ES005012",
	"ES005014",
	"ES005018",
	"ES005019",
	"ES005020",
	"ES005025",
] as const;

function buildCanaryFacetFiltersParam(): string {
	const orStoreFilters = ALDI_CANARY_STORE_IDS.map(
		(storeId) => `storeID:${storeId}`,
	);
	return encodeURIComponent(JSON.stringify([orStoreFilters]));
}

function buildParams(query: string, withCanaryStoreFilters: boolean): string {
	const baseParams = `query=${encodeURIComponent(query)}&hitsPerPage=40&clickAnalytics=true`;
	if (!withCanaryStoreFilters) {
		return baseParams;
	}

	return `${baseParams}&facetFilters=${buildCanaryFacetFiltersParam()}`;
}

/**
 * Aldi Scraper — best-effort. Limited online catalog in Canarias.
 * Targets the ES Aldi shop search endpoint.
 */
export class AldiScraperAdapter extends PlaywrightScraperAdapterBase {
	readonly name = "Aldi";
	private readonly productMapper: ProductMapper;

	constructor(productMapper: ProductMapper = defaultProductMapper) {
		super();
		this.productMapper = productMapper;
	}

	private async queryAlgolia(
		query: string,
		withCanaryStoreFilters: boolean,
	): Promise<AldiAlgoliaHit[]> {
		const params = buildParams(query, withCanaryStoreFilters);
		const response = await fetch(ALDI_ALGOLIA_URL, {
			method: "POST",
			headers: {
				"x-algolia-api-key": "19b0e28f08344395447c7bdeea32da58",
				"x-algolia-application-id": "L9KNU74IO7",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				requests: ALDI_CANARY_INDICES.map((indexName) => ({
					indexName,
					params,
				})),
			}),
		});

		if (!response.ok) {
			throw new Error(`Aldi API failed: ${response.statusText}`);
		}

		const data = (await response.json()) as AldiAlgoliaMultiQueryResponse;
		const results = data.results ?? [];
		return [...(results[0]?.hits || []), ...(results[1]?.hits || [])];
	}

	protected async scrape(query: string): Promise<IProduct[]> {
		logger.info(`[Aldi] Fetching from Algolia API for: "${query}"`);

		try {
			let allHits = await this.queryAlgolia(query, true);

			if (allHits.length === 0) {
				logger.warn(
					"[Aldi] Canary store facet filters returned 0 hits, retrying without filters.",
				);
				allHits = await this.queryAlgolia(query, false);
			}

			logger.info(`[Aldi] Found ${allHits.length} hits across indices.`);

			return Promise.all(
				allHits.map(async (hit) => {
					const name = hit.productName || hit.name || "Producto Aldi";
					const priceRaw = hit.salesPrice || hit.price || 0;
					const quantityRaw =
						hit.salesUnitFormatted || hit.sales_unit || "1 ud";
					const category = await categorize(name);

					return this.productMapper.toDomain({
						supermarket: this.name,
						name,
						category,
						priceRaw,
						pricePerUnitRaw: hit.basePriceValue,
						quantityRaw,
						unitRaw: hit.basePriceScale,
						image: hit.productPicture || hit.image_url || undefined,
						url:
							hit.productUrl ||
							(hit.url ? `https://www.aldi.es${hit.url}` : undefined),
						taxHint: `${name} IGIC`,
					});
				}),
			);
		} catch (error) {
			logger.error(`[Aldi] API Error: ${error}`);
			throw error;
		}
	}
}
