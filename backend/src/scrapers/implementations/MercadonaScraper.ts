import type { IProduct } from "../../interfaces/IProduct";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { ScraperBase } from "../base/ScraperBase";
import { MercadonaHttpClient } from "../mercadona/MercadonaHttpClient";
import {
	buildMercadonaHeaders,
	validateMercadonaHeaders,
	type MercadonaHeaders,
} from "../mercadona/MercadonaHeaders";
import { mapMercadonaProducts } from "../mercadona/MercadonaMapper";
import { resolveMercadonaWarehouse } from "../mercadona/MercadonaWarehouseResolver";
import type {
	MercadonaApiProduct,
	MercadonaSearchRequest,
	MercadonaSearchResponse,
} from "../mercadona/types";

interface MercadonaScraperDeps {
	buildHeaders?: () => MercadonaHeaders;
	validateHeaders?: (headers: MercadonaHeaders) => void;
	resolveWarehouse?: (postalCode: string) => string;
	searchClient?: (
		request: MercadonaSearchRequest,
		headers: MercadonaHeaders,
	) => Promise<MercadonaSearchResponse>;
	mapProducts?: (products: MercadonaApiProduct[]) => Promise<IProduct[]>;
}

/**
 * Mercadona Scraper — direct HTTP transport implementation.
 *
 * Standard flow:
 *  1. Build + validate mandatory Mercadona headers
 *  2. Resolve Las Palmas warehouse id (`wh`)
 *  3. Perform HTTP API search through Mercadona client
 *  4. Map API products to domain IProduct
 */
export class MercadonaScraper extends ScraperBase {
	readonly name = "Mercadona";
	private readonly postalCode = config.postalCode;
	private readonly buildHeaders: () => MercadonaHeaders;
	private readonly validateHeaders: (headers: MercadonaHeaders) => void;
	private readonly resolveWarehouse: (postalCode: string) => string;
	private readonly searchClient: (
		request: MercadonaSearchRequest,
		headers: MercadonaHeaders,
	) => Promise<MercadonaSearchResponse>;
	private readonly mapProducts: (
		products: MercadonaApiProduct[],
	) => Promise<IProduct[]>;

	constructor(
		circuitBreakerThreshold = config.circuitBreakerThreshold,
		deps: MercadonaScraperDeps = {},
	) {
		super(circuitBreakerThreshold);

		const httpClient = new MercadonaHttpClient();

		this.buildHeaders = deps.buildHeaders ?? buildMercadonaHeaders;
		this.validateHeaders = deps.validateHeaders ?? validateMercadonaHeaders;
		this.resolveWarehouse = deps.resolveWarehouse ?? resolveMercadonaWarehouse;
		this.searchClient =
			deps.searchClient ??
			((request, headers) => httpClient.search(request, headers));
		this.mapProducts = deps.mapProducts ?? mapMercadonaProducts;
	}

	protected async scrape(query: string): Promise<IProduct[]> {
		logger.info(`[Mercadona] Searching API for query: ${query}`);

		const headers = this.buildHeaders();
		this.validateHeaders(headers);

		const wh = this.resolveWarehouse(this.postalCode);
		const request: MercadonaSearchRequest = {
			query,
			offset: 0,
			limit: 24,
			wh,
		};

		const response = await this.searchClient(request, headers);
		return this.mapProducts(response.results);
	}
}
