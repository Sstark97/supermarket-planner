import { IScraper } from '../interfaces/IScraper';
import { IProduct } from '../interfaces/IProduct';
import { logger } from '../utils/logger';
import { prisma } from '../db/prisma';

export interface SearchResult {
    query: string;
    results: IProduct[];
    warnings: string[];
    totalCount: number;
    source: 'database' | 'live';
    scrapedAt: string;
}

export class SearchService {
    constructor(private readonly scrapers: IScraper[]) { }

    /**
     * Used by the Frontend API. Queries PostgreSQL extremely fast.
     */
    async searchFromDatabase(query?: string, category?: string, supermarket?: string, sortBy?: string): Promise<SearchResult> {
        logger.info(`[SearchService] searchFromDatabase - query: "${query}", category: "${category}", supermarket: "${supermarket}", sortBy: "${sortBy}"`);
        const rawResults = await prisma.product.findMany({
            where: {
                ...(query ? {
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    }
                } : {}),
                ...(category ? { category } : {}),
                ...(supermarket ? { supermarket } : {}),
            },
            take: 500, // Fetch more for deduplication
        });

        // Deduplication strategy: Group by normalized name and supermarket
        const uniqueMap = new Map<string, any>();

        const normalizeName = (name: string) =>
            name.toLowerCase()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
                .replace(/\s{2,}/g, " ")
                .trim();

        rawResults.forEach((p: any) => {
            const key = `${p.supermarket}:${normalizeName(p.name)}`;
            if (!uniqueMap.has(key) || p.pricePerUnit < uniqueMap.get(key).pricePerUnit) {
                uniqueMap.set(key, p);
            }
        });

        let results: IProduct[] = Array.from(uniqueMap.values()).map((p: any) => ({
            id: p.id,
            name: p.name,
            supermarket: p.supermarket,
            category: p.category as IProduct['category'],
            price: p.price,
            pricePerUnit: p.pricePerUnit,
            unit: p.unit,
            image: p.image || undefined,
            url: p.url || undefined,
            taxType: p.taxType as IProduct['taxType'],
            scrapedAt: p.scrapedAt.toISOString(),
        }));

        // Sorting
        if (sortBy === 'price_asc') {
            results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        } else if (sortBy === 'price_desc') {
            results.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        } else {
            // Default: Cheapest first
            results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        }

        return {
            query: query || '',
            results,
            warnings: [],
            totalCount: results.length,
            source: 'database',
            scrapedAt: new Date().toISOString(),
        };
    }

    /**
     * Used by the Cron Job to actually scrape the live websites.
     */
    async search(query: string): Promise<SearchResult> {
        const scrapedAt = new Date().toISOString();
        const warnings: string[] = [];

        logger.info(`[SearchService] Starting parallel scrapers for: "${query}"`);
        const start = Date.now();

        const scraperTasks = this.scrapers.map(async (scraper) => {
            const scraperStart = Date.now();
            try {
                const results = await scraper.search(query);
                logger.info(`[SearchService] ${scraper.name} completed: ${results.length} results in ${Date.now() - scraperStart}ms`);
                return results;
            } catch (err) {
                logger.error(`[SearchService] ${scraper.name} failed after ${Date.now() - scraperStart}ms: ${err}`);
                throw err;
            }
        });

        const settled = await Promise.allSettled(scraperTasks);
        const totalTime = Date.now() - start;
        logger.info(`[SearchService] All scrapers finished in ${totalTime}ms.`);

        const results: IProduct[] = [];

        settled.forEach((outcome, index) => {
            const scraperName = this.scrapers[index].name;
            if (outcome.status === 'fulfilled') {
                results.push(...outcome.value);
            } else {
                const reason = String((outcome as PromiseRejectedResult).reason);
                logger.error(`[SearchService] ${scraperName} rejected: ${reason}`);
                warnings.push(`${scraperName}: ${reason}`);
            }
        });

        // Sort by pricePerUnit ascending (cheapest equivalent first)
        results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);

        return {
            query,
            results,
            warnings,
            totalCount: results.length,
            source: 'live',
            scrapedAt,
        };
    }
}
