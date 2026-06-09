import { PlaywrightScraperAdapterBase } from "../PlaywrightScraperAdapterBase";
import type { HiperDinoRawProduct } from "@application/dto/ScraperPayloads";
import {
	defaultProductMapper,
	type ProductMapper,
} from "@domain/services/ProductMappingPolicy";
import type { IProduct } from "@domain/entities/IProduct";
import { categorize } from "@infrastructure/adapters/driven/categorization/ProductCategorizer";
import { logger } from "@infrastructure/logging/logger";
import { BrowserManager } from "../strategies/BrowserManager";
import { getRandomUserAgent, randomDelay } from "../strategies/StealthHelper";

const UNIT_PATTERN =
	/(\d+[.,]?\d*)\s?(kg|g|gr|l|ml|cl|ud|u|unid|unidad|pack|botella|bote|lata|sobre)/i;

export function extractHiperDinoUnit(
	name: string,
	descriptionTexts: string[],
): string {
	const normalizedTexts = descriptionTexts
		.map((text) => text.trim())
		.filter(Boolean);

	const secondaryTexts = normalizedTexts.filter((text) => text !== name);
	const unitText = secondaryTexts.find((text) => UNIT_PATTERN.test(text));

	return unitText ?? secondaryTexts[0] ?? "1 ud";
}

/**
 * HiperDino Scraper — most relevant local supermarket in Las Palmas.
 * Site uses traditional server-rendered HTML — lowest scraping difficulty.
 */
export class HiperDinoScraperAdapter extends PlaywrightScraperAdapterBase {
	readonly name = "HiperDino";
	private readonly productMapper: ProductMapper;

	constructor(productMapper: ProductMapper = defaultProductMapper) {
		super();
		this.productMapper = productMapper;
	}

	protected async scrape(query: string, _postalCode: string): Promise<IProduct[]> {
		const ua = getRandomUserAgent();
		const context = await BrowserManager.getInstance().getContext(ua);
		const page = await context.newPage();

		try {
			await randomDelay(200, 600);

			const url = `https://www.hiperdino.es/catalogsearch/result/?q=${encodeURIComponent(query)}`;
			logger.info(`[HiperDino] Navigating to ${url}`);
			await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

			const rawProducts = await this.collectProductsAcrossPages(page);
			const uniqueRawProducts = Array.from(
				new Map(
					rawProducts
						.filter((rawProduct) => rawProduct.name && rawProduct.price)
						.map((rawProduct) => [
							`${rawProduct.name}|${rawProduct.price}|${rawProduct.link}`,
							rawProduct,
						]),
				).values(),
			);

			const products: IProduct[] = await Promise.all(
				uniqueRawProducts.map(async (rawProduct) => {
					const quantityRaw = extractHiperDinoUnit(
						rawProduct.name,
						rawProduct.descriptionTexts,
					);
					const category = await categorize(rawProduct.name);
					return this.productMapper.toDomain({
						supermarket: this.name,
						name: rawProduct.name,
						category,
						priceRaw: rawProduct.price,
						quantityRaw,
						image: rawProduct.image || undefined,
						url: rawProduct.link || undefined,
						taxHint: `${rawProduct.name} IGIC`,
					});
				}),
			);

			return products;
		} finally {
			await page.close();
			await context.close();
		}
	}

	private async collectProductsAcrossPages(
		page: import("playwright").Page,
	): Promise<HiperDinoRawProduct[]> {
		const collectedProducts: HiperDinoRawProduct[] = [];
		const visitedUrls = new Set<string>();
		let currentUrl = page.url();

		for (let iteration = 0; iteration < 6; iteration += 1) {
			visitedUrls.add(currentUrl);
			logger.info(`[HiperDino] Reading page ${iteration + 1}: ${currentUrl}`);

			await page
				.waitForSelector(".item--container", {
					timeout: 10000,
				})
				.catch(() =>
					logger.warn(`[HiperDino] Product grid timeout or not found`),
				);
			await randomDelay(1000, 1400);

			const { rawProducts, nextPageUrl } = await page.evaluate(() => {
				const cards = document.querySelectorAll(".product-container");
				const rawProducts = Array.from(cards).map((card) => {
					const container = card.closest(".item--container");
					const name =
						container
							?.querySelector(".description__text.name")
							?.textContent?.trim() ?? "";
					const price =
						container
							?.querySelector(".price__text.price")
							?.textContent?.trim() ?? "";
					const image =
						(container
							?.querySelector(".product__image img")
							?.getAttribute("data-src") ||
							container
								?.querySelector(".product__image img")
								?.getAttribute("src")) ??
						"";
					const quickviewUrl = card.getAttribute("data-quickview-url") ?? "";
					const productId = card.getAttribute("data-product-id") ?? "";
					const link = productId
						? `${quickviewUrl}${quickviewUrl.endsWith("/") ? "" : "/"}${productId}`
						: quickviewUrl;
					const descriptionTexts = Array.from(
						container?.querySelectorAll(".description__text") ?? [],
					)
						.map((node) => node.textContent?.trim() ?? "")
						.filter(Boolean);
					return { name, price, image, link, descriptionTexts };
				});

				let nextPageUrl: string | null = null;
				const explicitNextAnchor = document.querySelector<HTMLAnchorElement>(
					"li.pages-item-next a, a.action.next, a[rel='next']",
				);
				if (explicitNextAnchor?.href) {
					nextPageUrl = explicitNextAnchor.href;
				} else {
					const current = new URL(window.location.href);
					const currentPage = Number(current.searchParams.get("p") ?? "1");
					const query = current.searchParams.get("q") ?? "";
					const pageCandidates = Array.from(
						document.querySelectorAll<HTMLAnchorElement>("a[href]"),
					)
						.map((anchor) => anchor.href)
						.filter((href) => {
							try {
								const candidate = new URL(href);
								const candidatePage = Number(
									candidate.searchParams.get("p") ?? "1",
								);
								return (
									candidate.origin === current.origin &&
									candidate.pathname === current.pathname &&
									(candidate.searchParams.get("q") ?? "") === query &&
									candidatePage > currentPage
								);
							} catch {
								return false;
							}
						})
						.sort((left, right) => {
							const leftPage = Number(
								new URL(left).searchParams.get("p") ?? "1",
							);
							const rightPage = Number(
								new URL(right).searchParams.get("p") ?? "1",
							);
							return leftPage - rightPage;
						});
					nextPageUrl = pageCandidates[0] ?? null;
				}

				return { rawProducts, nextPageUrl };
			});

			collectedProducts.push(...rawProducts);

			if (!nextPageUrl || visitedUrls.has(nextPageUrl) || iteration === 5) {
				break;
			}

			logger.info(`[HiperDino] Navigating to next page: ${nextPageUrl}`);
			currentUrl = nextPageUrl;
			await page.goto(nextPageUrl, {
				waitUntil: "domcontentloaded",
				timeout: 20000,
			});
		}

		logger.info(
			`[HiperDino] Collected ${collectedProducts.length} raw products across paginated results.`,
		);
		return collectedProducts;
	}
}
