import type { LidlRawProduct } from "../../../../../application/dto/ScraperPayloads";
import {
	defaultProductMapper,
	type ProductMapper,
} from "../../../../../domain/services/ProductMappingPolicy";
import type { IProduct } from "../../../../../domain/entities/IProduct";
import { categorize } from "../../categorization/ProductCategorizer";
import { logger } from "../../../../logging/logger";
import { PlaywrightScraperAdapterBase } from "../PlaywrightScraperAdapterBase";
import { BrowserManager } from "../strategies/BrowserManager";
import {
	blockUnnecessaryResources,
	getRandomUserAgent,
	randomDelay,
} from "../strategies/StealthHelper";

/**
 * Lidl Scraper — best-effort. Lidl ES has limited Canary Islands catalog.
 * Targets the ES online shop and filters by search query.
 */
export class LidlScraperAdapter extends PlaywrightScraperAdapterBase {
	readonly name = "Lidl";
	private readonly productMapper: ProductMapper;

	constructor(productMapper: ProductMapper = defaultProductMapper) {
		super();
		this.productMapper = productMapper;
	}

	protected async scrape(query: string): Promise<IProduct[]> {
		const ua = getRandomUserAgent();
		const context = await BrowserManager.getInstance().getContext(ua);
		const page = await context.newPage();

		try {
			await blockUnnecessaryResources(page);
			await randomDelay(300, 800);

			const url = `https://www.lidl.es/buscar?q=${encodeURIComponent(query)}`;
			logger.info(`[Lidl] Navigating to ${url}`);
			await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

			logger.info(`[Lidl] Waiting for article selectors...`);
			await page
				.waitForSelector('[class*="product"], article', { timeout: 8000 })
				.catch(() =>
					logger.warn(`[Lidl] Article selector timeout or not found`),
				);

			logger.info(`[Lidl] Evaluating DOM...`);
			const rawProducts = await page.evaluate<LidlRawProduct[]>(() => {
				const cards = document.querySelectorAll(
					'article, [class*="product-grid-item"], [class*="ProductCard"]',
				);
				return Array.from(cards).map((card) => ({
					name:
						card
							.querySelector('h3, h4, [class*="title"], [class*="name"]')
							?.textContent?.trim() ?? "",
					price:
						card
							.querySelector('[class*="price"], .price')
							?.textContent?.trim() ?? "",
					image: (card.querySelector("img") as HTMLImageElement)?.src ?? "",
					link: (card.querySelector("a") as HTMLAnchorElement)?.href ?? "",
					unit:
						card
							.querySelector('[class*="unit"], [class*="per"]')
							?.textContent?.trim() ?? "1 ud",
				}));
			});

			return Promise.all(
				rawProducts
					.filter((p) => p.name && p.price)
					.map(async (p) => {
						const category = await categorize(p.name);
						return this.productMapper.toDomain({
							supermarket: this.name,
							name: p.name,
							category,
							priceRaw: p.price,
							quantityRaw: p.unit,
							image: p.image || undefined,
							url: p.link || undefined,
							taxHint: p.name,
						});
					}),
			);
		} finally {
			await page.close();
			await context.close();
		}
	}
}
