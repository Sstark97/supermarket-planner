import { ScraperBase } from "../base/ScraperBase";
import type { IProduct } from "../../interfaces/IProduct";
import { detectTaxType } from "../../utils/PriceNormalizer";
import { categorize } from "../../utils/ProductCategorizer";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * Aldi Scraper — best-effort. Limited online catalog in Canarias.
 * Targets the ES Aldi shop search endpoint.
 */
export class AldiScraper extends ScraperBase {
	readonly name = "Aldi";

	protected async scrape(query: string): Promise<IProduct[]> {
		logger.info(`[Aldi] Fetching from Algolia API for: "${query}"`);

		try {
			const response = await fetch(
				"https://l9knu74io7-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.14.2)",
				{
					method: "POST",
					headers: {
						"x-algolia-api-key": "19b0e28f08344395447c7bdeea32da58",
						"x-algolia-application-id": "L9KNU74IO7",
						"content-type": "application/json",
					},
					body: JSON.stringify({
						requests: [
							{
								indexName: "prod_es_es_es_offers",
								params: `query=${encodeURIComponent(query)}&hitsPerPage=40&clickAnalytics=true`,
							},
							{
								indexName: "prod_es_es_es_assortment",
								params: `query=${encodeURIComponent(query)}&hitsPerPage=40&clickAnalytics=true`,
							},
						],
					}),
				},
			);

			if (!response.ok) {
				throw new Error(`Aldi API failed: ${response.statusText}`);
			}

			const data = (await response.json()) as any;
			const allHits = [
				...(data.results?.[0]?.hits || []),
				...(data.results?.[1]?.hits || []),
			];

			logger.info(`[Aldi] Found ${allHits.length} hits across indices.`);

			return Promise.all(
				allHits.map(async (hit: any) => {
					const name = hit.productName || hit.name || "Producto Aldi";
					const price = hit.salesPrice || hit.price || 0;
					const unit = hit.salesUnitFormatted || hit.sales_unit || "1 ud";
					const category = await categorize(name);

					return {
						id: uuidv4(),
						name: name,
						supermarket: this.name,
						category,
						price: Number(price),
						pricePerUnit: hit.basePriceValue || Number(price),
						unit: hit.basePriceScale || unit,
						image: hit.productPicture || hit.image_url || undefined,
						url:
							hit.productUrl ||
							(hit.url ? `https://www.aldi.es${hit.url}` : undefined),
						taxType: detectTaxType(name),
						scrapedAt: new Date().toISOString(),
					} satisfies IProduct;
				}),
			);
		} catch (error) {
			logger.error(`[Aldi] API Error: ${error}`);
			throw error;
		}
	}
}
