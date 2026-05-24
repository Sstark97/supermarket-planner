import { chromium, Browser, BrowserContext } from 'playwright';
import { config } from '../../config';

/**
 * Singleton BrowserManager — launches a single Chromium browser instance
 * and creates isolated BrowserContexts per scraping session.
 * This avoids launching a new browser per request, saving significant CPU/RAM.
 */
export class BrowserManager {
    private static instance: BrowserManager;
    private browser: Browser | null = null;

    private constructor() { }

    static getInstance(): BrowserManager {
        if (!BrowserManager.instance) {
            BrowserManager.instance = new BrowserManager();
        }
        return BrowserManager.instance;
    }

    async getBrowser(): Promise<Browser> {
        if (!this.browser || !this.browser.isConnected()) {
            this.browser = await chromium.launch({
                headless: config.playwrightHeadless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
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
        return browser.newContext({
            userAgent,
            locale: 'es-ES',
            timezoneId: 'Atlantic/Canary',
            viewport: { width: 1280, height: 800 },
            extraHTTPHeaders: {
                'Accept-Language': 'es-ES,es;q=0.9',
            },
        });
    }

    async shutdown(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
