import type { Browser, BrowserContext } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "playwright-extra-plugin-stealth";
import { config } from "../../config";

let stealthConfigured = false;

/**
 * Singleton BrowserManager — launches a single Chromium browser instance
 * and creates isolated BrowserContexts per scraping session.
 * This avoids launching a new browser per request, saving significant CPU/RAM.
 */
export class BrowserManager {
	private static instance: BrowserManager;
	private browser: Browser | null = null;

	private constructor() {}

	static getInstance(): BrowserManager {
		if (!BrowserManager.instance) {
			BrowserManager.instance = new BrowserManager();
		}
		return BrowserManager.instance;
	}

	private configureStealth(): void {
		if (stealthConfigured) {
			return;
		}

		chromium.use(StealthPlugin());
		stealthConfigured = true;
	}

	async getBrowser(): Promise<Browser> {
		if (!this.browser || !this.browser.isConnected()) {
			this.configureStealth();
			this.browser = await chromium.launch({
				headless: config.playwrightHeadless,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-blink-features=AutomationControlled",
					"--disable-infobars",
				],
			});
		}
		return this.browser;
	}

	/**
	 * Creates a fresh isolated BrowserContext with a given User-Agent.
	 * Caller is responsible for closing the context when done.
	 */
	async getContext(userAgent?: string): Promise<BrowserContext> {
		const browser = await this.getBrowser();
		const context = await browser.newContext({
			userAgent,
			locale: "es-ES",
			timezoneId: "Atlantic/Canary",
			viewport: { width: 1280, height: 800 },
			extraHTTPHeaders: {
				"Accept-Language": "es-ES,es;q=0.9",
			},
		});

		await context.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", {
				get: () => undefined,
			});
		});

		return context;
	}

	async shutdown(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}
}
