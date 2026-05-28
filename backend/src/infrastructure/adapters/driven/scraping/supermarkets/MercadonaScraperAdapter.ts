import type {
	MercadonaApiProduct,
	MercadonaDomProduct,
	MercadonaSearchResponse,
} from "../../../../../application/dto/ScraperPayloads";
import { config } from "../../../../../config";
import {
	defaultProductMapper,
	type ProductMapper,
} from "../../../../../domain/services/ProductMappingPolicy";
import type { IProduct } from "../../../../../interfaces/IProduct";
import { categorize } from "../../../../../utils/ProductCategorizer";
import { logger } from "../../../../../utils/logger";
import { PlaywrightScraperAdapterBase } from "../PlaywrightScraperAdapterBase";
import { BrowserManager } from "../strategies/BrowserManager";
import { getRandomUserAgent, randomDelay } from "../strategies/StealthHelper";

/**
 * Mercadona Scraper — SPA (React/Next.js) that requires postal code injection.
 *
 * Strategy:
 *  1. Intercept the internal search API (api2.mercadona.es) via page.route.
 *  2. If the CP modal appears, inject it programmatically.
 *  3. Parse the internal JSON response — far more reliable than DOM scraping on an SPA.
 */
export class MercadonaScraperAdapter extends PlaywrightScraperAdapterBase {
	readonly name = "Mercadona";
	private readonly productMapper: ProductMapper;
	private readonly postalCode = config.postalCode; // 35010

	constructor(productMapper: ProductMapper = defaultProductMapper) {
		super();
		this.productMapper = productMapper;
	}

	protected async scrape(query: string): Promise<IProduct[]> {
		const ua = getRandomUserAgent();
		const context = await BrowserManager.getInstance().getContext(ua);

		// Inject postal code into localStorage before navigation
		await context.addInitScript((cp) => {
			try {
				localStorage.setItem("postal_code", cp);
				localStorage.setItem("wh", "3544"); // Specific warehouse for 35010
			} catch (_) {
				/* ignore in sandboxed env */
			}
		}, this.postalCode);

		const page = await context.newPage();
		const collectedProducts: IProduct[] = [];

		try {
			logger.info("[Mercadona] Intercepting Search API...");
			let apiResolved = false;
			await page.route("**/api2.mercadona.es/api/search**", async (route) => {
				const response = await route.fetch();
				const json = (await response
					.json()
					.catch(() => null)) as MercadonaSearchResponse | null;

				if (json?.results) {
					const parsed = await Promise.all(
						json.results.map(async (item: MercadonaApiProduct) => {
							const name = item.display_name ?? "";
							const priceRaw =
								item.price_instructions?.unit_price ??
								item.price_instructions?.bulk_price ??
								0;
							const quantityRaw = item.price_instructions?.unit_size
								? `${item.price_instructions.unit_size} ${item.price_instructions.size_format ?? ""}`.trim()
								: "1 ud";
							const category = await categorize(name);

							return this.productMapper.toDomain({
								supermarket: this.name,
								name,
								category,
								priceRaw,
								quantityRaw,
								image: item.thumbnail ?? undefined,
								url: `https://tienda.mercadona.es/product/${item.id}`,
								taxHint: "IGIC",
							});
						}),
					);
					collectedProducts.push(...parsed);
					apiResolved = true;
				}
				await route.fulfill({ response });
			});

			logger.info("[Mercadona] Going to home for CP injection...");
			await page.goto("https://tienda.mercadona.es", {
				waitUntil: "domcontentloaded",
				timeout: 30000,
			});

			// Handle postal code modal if it appears
			const cpInputSelector =
				'input[placeholder*="postal"], input[name*="postal"], input[id*="postal"]';
			const hasCpModal = await page.$(cpInputSelector).catch(() => null);
			if (hasCpModal) {
				await page.fill(cpInputSelector, this.postalCode);
				await page.keyboard.press("Enter");
				await randomDelay(1500, 3000);
			}

			// Navigate to search
			const searchUrl = `https://tienda.mercadona.es/search-results?query=${encodeURIComponent(query)}`;
			logger.info(`[Mercadona] Navigating to searchUrl: ${searchUrl}`);

			// Start waiting for the API response BEFORE navigating
			const apiResponsePromise = page
				.waitForResponse(
					(response) =>
						response.url().includes("api2.mercadona.es/api/search") &&
						response.status() === 200,
					{ timeout: 15000 },
				)
				.catch(() => null);

			await page.goto(searchUrl, {
				waitUntil: "domcontentloaded",
				timeout: 30000,
			});

			// Wait for either the API promise to resolve or a brief delay
			await Promise.race([
				apiResponsePromise,
				new Promise((resolve) => setTimeout(resolve, 5000)),
			]);

			// Wait for API intercept to resolve, fallback to DOM scraping if needed
			if (!apiResolved) {
				logger.info(
					"[Mercadona] API not resolved, falling back to DOM parsing. Waiting for ProductCard...",
				);
				await page
					.waitForSelector('[class*="product-cell"], [class*="ProductCard"]', {
						timeout: 10000,
					})
					.catch(() =>
						logger.warn("[Mercadona] ProductCard timeout or not found"),
					);

				logger.info("[Mercadona] Evaluating DOM...");
				const domProducts = await page.evaluate<MercadonaDomProduct[]>(() => {
					const cards = document.querySelectorAll(
						'[class*="product-cell"], [class*="ProductCard"]',
					);
					return Array.from(cards).map((card) => ({
						name:
							card
								.querySelector('[class*="name"], h3, h4')
								?.textContent?.trim() ?? "",
						price:
							card.querySelector('[class*="price"]')?.textContent?.trim() ?? "",
						image: (card.querySelector("img") as HTMLImageElement)?.src ?? "",
						unit:
							card
								.querySelector('[class*="unit"], [class*="size"]')
								?.textContent?.trim() ?? "1 ud",
					}));
				});

				const fallback = await Promise.all(
					domProducts
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
								taxHint: "IGIC",
							});
						}),
				);
				collectedProducts.push(...fallback);
			}

			return collectedProducts;
		} finally {
			await page.close();
			await context.close();
		}
	}
}
