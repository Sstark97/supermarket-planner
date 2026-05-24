import { ScraperBase } from '../base/ScraperBase';
import { IProduct } from '../../interfaces/IProduct';
import { BrowserManager } from '../strategies/BrowserManager';
import { blockUnnecessaryResources, getRandomUserAgent, randomDelay } from '../strategies/StealthHelper';
import { normalizePricePerUnit, detectTaxType } from '../../utils/PriceNormalizer';
import { categorize } from '../../utils/ProductCategorizer';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lidl Scraper — best-effort. Lidl ES has limited Canary Islands catalog.
 * Targets the ES online shop and filters by search query.
 */
export class LidlScraper extends ScraperBase {
    readonly name = 'Lidl';

    protected async scrape(query: string): Promise<IProduct[]> {
        const ua = getRandomUserAgent();
        const context = await BrowserManager.getInstance().getContext(ua);
        const page = await context.newPage();

        try {
            await blockUnnecessaryResources(page);
            await randomDelay(300, 800);

            const url = `https://www.lidl.es/buscar?q=${encodeURIComponent(query)}`;
            logger.info(`[Lidl] Navigating to ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

            logger.info(`[Lidl] Waiting for article selectors...`);
            await page.waitForSelector('[class*="product"], article', { timeout: 8000 })
                .catch(() => logger.warn(`[Lidl] Article selector timeout or not found`));

            logger.info(`[Lidl] Evaluating DOM...`);
            const rawProducts = await page.evaluate(() => {
                const cards = document.querySelectorAll('article, [class*="product-grid-item"], [class*="ProductCard"]');
                return Array.from(cards).map(card => ({
                    name: card.querySelector('h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim() ?? '',
                    price: card.querySelector('[class*="price"], .price')?.textContent?.trim() ?? '',
                    image: (card.querySelector('img') as HTMLImageElement)?.src ?? '',
                    link: (card.querySelector('a') as HTMLAnchorElement)?.href ?? '',
                    unit: card.querySelector('[class*="unit"], [class*="per"]')?.textContent?.trim() ?? '1 ud',
                }));
            });

            return Promise.all(
                rawProducts.filter(p => p.name && p.price).map(async p => {
                    const normalized = normalizePricePerUnit(p.price, p.unit);
                    const category = await categorize(p.name);
                    return {
                        id: uuidv4(),
                        name: p.name,
                        supermarket: this.name,
                        category,
                        price: normalized.price,
                        pricePerUnit: normalized.pricePerUnit,
                        unit: normalized.unit,
                        image: p.image || undefined,
                        url: p.link || undefined,
                        taxType: detectTaxType(p.name),
                        scrapedAt: new Date().toISOString(),
                    } satisfies IProduct;
                }),
            );
        } finally {
            await page.close();
            await context.close();
        }
    }
}
