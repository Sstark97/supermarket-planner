import { PlaywrightScraperAdapterBase } from "../PlaywrightScraperAdapterBase";
import type { HiperDinoRawProduct } from "../../../../../application/dto/ScraperPayloads";
import {
	defaultProductMapper,
	type ProductMapper,
} from "../../../../../domain/services/ProductMappingPolicy";
import type { IProduct } from "../../../../../domain/entities/IProduct";
import { categorize } from "../../categorization/ProductCategorizer";
import { logger } from "../../../../logging/logger";
import { BrowserManager } from "../strategies/BrowserManager";
import {
	blockUnnecessaryResources,
	getRandomUserAgent,
	randomDelay,
} from "../strategies/StealthHelper";

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

	protected async scrape(query: string): Promise<IProduct[]> {
		const ua = getRandomUserAgent();
		const context = await BrowserManager.getInstance().getContext(ua);
		const page = await context.newPage();

		try {
			await blockUnnecessaryResources(page);
			await randomDelay(200, 600);

			const url = `https://www.hiperdino.es/catalogsearch/result/?q=${encodeURIComponent(query)}`;
			logger.info(`[HiperDino] Navigating to ${url}`);
			await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

			logger.info(`[HiperDino] Waiting for product grid...`);
			await page
				.waitForSelector(".item--container", {
					timeout: 10000,
				})
				.catch(() =>
					logger.warn(`[HiperDino] Product grid timeout or not found`),
				);

			logger.info(`[HiperDino] Evaluating DOM...`);
			const rawProducts = await page.evaluate<HiperDinoRawProduct[]>(() => {
				const items = document.querySelectorAll(".item--container");
				return Array.from(items).map((el) => {
					const name =
						el.querySelector(".description__text.name")?.textContent?.trim() ??
						"";
					const price =
						el.querySelector(".price__text.price")?.textContent?.trim() ?? "";
					const image =
						(el
							.querySelector(".product__image img")
							?.getAttribute("data-src") ||
							el.querySelector(".product__image img")?.getAttribute("src")) ??
						"";
					const link =
						el
							.querySelector(".product-container")
							?.getAttribute("data-quickview-url") ?? "";
					const descriptionTexts = Array.from(
						el.querySelectorAll(".description__text"),
					)
						.map((node) => node.textContent?.trim() ?? "")
						.filter(Boolean);
					return { name, price, image, link, descriptionTexts };
				});
			});

			const products: IProduct[] = await Promise.all(
				rawProducts
					.filter((p) => p.name && p.price)
					.map(async (p) => {
						const quantityRaw = extractHiperDinoUnit(
							p.name,
							p.descriptionTexts,
						);
						const category = await categorize(p.name);
						return this.productMapper.toDomain({
							supermarket: this.name,
							name: p.name,
							category,
							priceRaw: p.price,
							quantityRaw,
							image: p.image || undefined,
							url: p.link || undefined,
							taxHint: `${p.name} IGIC`,
						});
					}),
			);

			return products;
		} finally {
			await page.close();
			await context.close();
		}
	}
}
