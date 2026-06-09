import { describe, expect, it } from "vitest";
import { PlaywrightScraperAdapterBase } from "./PlaywrightScraperAdapterBase";
import type { IProduct } from "@domain/entities/IProduct";

class TestScraper extends PlaywrightScraperAdapterBase {
	readonly name = "TestScraper";

	constructor(
		private readonly implementation: (
			query: string,
			postalCode: string,
		) => Promise<IProduct[]>,
		threshold = 2,
	) {
		super(threshold);
	}

	protected async scrape(query: string, postalCode: string): Promise<IProduct[]> {
		return this.implementation(query, postalCode);
	}
}

describe("PlaywrightScraperAdapterBase", () => {
	it("rethrows failures and opens circuit after reaching threshold", async () => {
		let attempts = 0;
		const scraper = new TestScraper(async () => {
			attempts += 1;
			throw new Error(`boom-${attempts}`);
		}, 2);

		await expect(scraper.search("milk", "35010")).rejects.toThrow("boom-1");
		expect(scraper.isCircuitOpen).toBe(false);

		await expect(scraper.search("milk", "35010")).rejects.toThrow("boom-2");
		expect(scraper.isCircuitOpen).toBe(true);

		await expect(scraper.search("milk", "35010")).resolves.toEqual([]);
		expect(attempts).toBe(2);
	});

	it("resets failure streak after a successful scrape", async () => {
		let attempts = 0;
		const scraper = new TestScraper(async () => {
			attempts += 1;
			if (attempts === 1 || attempts === 3) {
				throw new Error(`failure-${attempts}`);
			}

			return [];
		}, 2);

		await expect(scraper.search("bread", "35010")).rejects.toThrow("failure-1");
		await expect(scraper.search("bread", "35010")).resolves.toEqual([]);
		await expect(scraper.search("bread", "35010")).rejects.toThrow("failure-3");

		expect(scraper.isCircuitOpen).toBe(false);
	});

	it("propagates the postal code through to scrape()", async () => {
		const receivedArgs: Array<{ query: string; postalCode: string }> = [];
		const scraper = new TestScraper(async (query, postalCode) => {
			receivedArgs.push({ query, postalCode });
			return [];
		});

		await scraper.search("eggs", "35001");

		expect(receivedArgs).toEqual([{ query: "eggs", postalCode: "35001" }]);
	});
});
