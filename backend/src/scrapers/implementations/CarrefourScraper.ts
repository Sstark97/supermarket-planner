import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BrowserContext, Page } from "playwright";
import type {
	CarrefourSearchApiResponse,
	CarrefourSearchDoc,
} from "../../application/dto/ScraperPayloads";
import {
	defaultProductMapper,
	type ProductMapper,
} from "../../domain/services/ProductMappingPolicy";
import type { IProduct } from "../../interfaces/IProduct";
import { categorize } from "../../utils/ProductCategorizer";
import { logger } from "../../utils/logger";
import { ScraperBase } from "../base/ScraperBase";
import { getRandomUserAgent, randomDelay } from "../strategies/StealthHelper";
import { BrowserManager } from "../strategies/BrowserManager";

/**
 * Carrefour Scraper — protected by Akamai/Datadome bot detection.
 *
 * Strategy:
 *  - Stealth browser context with random user-agent.
 *  - Human-like sequential navigation (home -> cookie consent -> regional cookie -> search).
 *  - If blocked/intercepted (timeout/selector issues), persist visual debug artifacts and rethrow.
 */
export class CarrefourScraper extends ScraperBase {
	readonly name = "Carrefour";
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
			await this.navigateLikeHuman(page, context, query);

			logger.info("[Carrefour] Waiting for API response...");
			const response = await page.waitForResponse(
				(networkResponse: { url: () => string; status: () => number }) =>
					networkResponse.url().includes("search-api/query/v1/search") &&
					networkResponse.status() === 200,
				{ timeout: 15000 },
			);

			const data = (await response.json()) as CarrefourSearchApiResponse;
			const docs: CarrefourSearchDoc[] = data.content?.docs || [];
			logger.info(`[Carrefour] Found ${docs.length} products in API response`);

			if (docs.length > 0) {
				logger.debug(`[Carrefour] Sample doc: ${JSON.stringify(docs[0])}`);
			}

			return Promise.all(
				docs.map(async (doc) => {
					const name = doc.display_name || doc.name || "Producto Carrefour";
					const priceRaw =
						doc.active_price || doc.app_price || doc.list_price || 0;
					const image =
						doc.image_path || doc.image || doc.image_url || undefined;
					const category = await categorize(name);

					return this.productMapper.toDomain({
						supermarket: this.name,
						name,
						category,
						priceRaw,
						quantityRaw: doc.price_per_unit_text || "1 ud",
						image: image || undefined,
						url: doc.url ? `https://www.carrefour.es${doc.url}` : undefined,
						taxHint: name,
					});
				}),
			);
		} catch (error) {
			if (this.shouldCaptureDebugArtifacts(error)) {
				await this.captureDebugArtifacts(page, query);
			}

			logger.error(`[Carrefour] Scrape failed: ${error}`);
			throw error;
		} finally {
			await page.close();
			await context.close();
		}
	}

	private async navigateLikeHuman(
		page: Page,
		context: BrowserContext,
		query: string,
	): Promise<void> {
		const homeUrl = "https://www.carrefour.es/supermercado";
		const searchUrl = `https://www.carrefour.es/supermercado?query=${encodeURIComponent(query)}`;

		logger.info("[Carrefour] Step 1/4: Visiting home page");
		await page.goto(homeUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
		await randomDelay(700, 1800);

		logger.info("[Carrefour] Step 2/4: Accepting cookie banner if present");
		await this.acceptCookieBanner(page);

		logger.info("[Carrefour] Step 3/4: Injecting regional salepoint cookie");
		await context.addCookies([
			{
				name: "salepoint",
				value: "0000GC||35010|A_DOMICILIO|1",
				domain: ".carrefour.es",
				path: "/",
			},
		]);

		await randomDelay(350, 1000);

		logger.info(`[Carrefour] Step 4/4: Navigating to search URL: ${searchUrl}`);
		await page.goto(searchUrl, {
			waitUntil: "domcontentloaded",
			timeout: 30000,
		});
	}

	private async acceptCookieBanner(page: Page): Promise<void> {
		const candidates = [
			"button#onetrust-accept-btn-handler",
			"button[aria-label*='Aceptar']",
			"button[title*='Aceptar']",
			"button:has-text('Aceptar')",
			"button:has-text('Accept')",
		];

		for (const selector of candidates) {
			try {
				await page.locator(selector).first().click({ timeout: 2500 });
				await randomDelay(250, 650);
				logger.info(
					`[Carrefour] Cookie banner accepted with selector: ${selector}`,
				);
				return;
			} catch {
				// Try next selector candidate
			}
		}

		throw new Error("Missing selector: cookie banner accept button");
	}

	private shouldCaptureDebugArtifacts(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}

		const message = error.message.toLowerCase();
		return message.includes("timeout") || message.includes("selector");
	}

	private async captureDebugArtifacts(
		page: Page,
		query: string,
	): Promise<void> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const safeQuery =
			query.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40) || "empty-query";
		const debugDir = path.resolve(
			process.cwd(),
			"debug",
			`carrefour-${timestamp}`,
		);

		const screenshotPath = path.join(debugDir, `${safeQuery}.png`);
		const htmlPath = path.join(debugDir, `${safeQuery}.html`);

		await mkdir(debugDir, { recursive: true });

		const html = await page.content();
		await Promise.all([
			page.screenshot({ path: screenshotPath, fullPage: true }),
			writeFile(htmlPath, html, "utf-8"),
		]);

		logger.error(
			`[Carrefour] Debug artifacts saved at ${debugDir} (url=${page.url()}, screenshot=${screenshotPath}, html=${htmlPath})`,
		);
	}
}
