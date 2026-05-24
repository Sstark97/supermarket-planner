import { ScraperBase } from "../base/ScraperBase";
import type { IProduct } from "../../interfaces/IProduct";
import { BrowserManager } from "../strategies/BrowserManager";
import { getRandomUserAgent, randomDelay } from "../strategies/StealthHelper";
import {
	normalizePricePerUnit,
	detectTaxType,
} from "../../utils/PriceNormalizer";
import { categorize } from "../../utils/ProductCategorizer";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * Carrefour Scraper — protected by Akamai/Datadome bot detection.
 *
 * Strategy:
 *  - Use random user-agent + realistic headers.
 *  - Humanized typing in search bar.
 *  - Spoof navigator properties to avoid fingerprinting.
 *  - If blocked (captcha detected), throw so circuit breaker can track it.
 */
export class CarrefourScraper extends ScraperBase {
	readonly name = "Carrefour";

	protected async scrape(query: string): Promise<IProduct[]> {
		const ua = getRandomUserAgent();
		const context = await BrowserManager.getInstance().getContext(ua);

		// Inject regional cookie for 35010
		await context.addCookies([
			{
				name: "salepoint",
				value: "0000GC||35010|A_DOMICILIO|1",
				domain: ".carrefour.es",
				path: "/",
			},
		]);

		const page = await context.newPage();

		try {
			await randomDelay(500, 1500);

			const searchUrl = `https://www.carrefour.es/supermercado?query=${encodeURIComponent(query)}`;
			logger.info(`[Carrefour] Navigating to ${searchUrl}`);

			// Prepare to intercept the Empathy.co search API response
			const responsePromise = page.waitForResponse(
				(response: { url: () => string; status: () => number }) =>
					response.url().includes("search-api/query/v1/search") &&
					response.status() === 200,
				{ timeout: 15000 },
			);

			await page.goto(searchUrl, {
				waitUntil: "domcontentloaded",
				timeout: 30000,
			});

			logger.info(`[Carrefour] Waiting for API response...`);
			const response = await responsePromise;
			const data = await response.json();

			const docs = data.content?.docs || [];
			logger.info(`[Carrefour] Found ${docs.length} products in API response`);

			if (docs.length > 0) {
				logger.debug(`[Carrefour] Sample doc: ${JSON.stringify(docs[0])}`);
			}

			return Promise.all(
				docs.map(async (doc: any) => {
					const name = doc.display_name || doc.name || "Producto Carrefour";

					// From debug log: "active_price": 1.49
					const price =
						doc.active_price || doc.app_price || doc.list_price || 0;

					// From debug log: "image_path": "https://static.carrefour.es/..."
					const image =
						doc.image_path || doc.image || doc.image_url || undefined;

					// From debug log: "price_per_unit_text": "0,99 €/l"
					// We can use our normalizer for this
					const unitText = doc.price_per_unit_text || "1 ud";
					const normalized = normalizePricePerUnit(`${price} €`, unitText);

					const category = await categorize(name);

					return {
						id: uuidv4(),
						name: name,
						supermarket: this.name,
						category,
						price: Number(price),
						pricePerUnit: normalized.pricePerUnit,
						unit: normalized.unit,
						image: image || undefined,
						url: doc.url ? `https://www.carrefour.es${doc.url}` : undefined,
						taxType: detectTaxType(name),
						scrapedAt: new Date().toISOString(),
					} satisfies IProduct;
				}),
			);
		} catch (error) {
			logger.error(`[Carrefour] Scrape failed: ${error}`);
			throw error;
		} finally {
			await page.close();
			await context.close();
		}
	}
}
