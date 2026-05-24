import { describe, expect, it, vi } from "vitest";
import { AldiScraper } from "./AldiScraper";

describe("AldiScraper", () => {
	it("rethrows API errors instead of returning empty results", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				statusText: "Service Unavailable",
			}),
		);

		const scraper = new AldiScraper();

		await expect(scraper.search("yogur")).rejects.toThrow(
			"Aldi API failed: Service Unavailable",
		);

		vi.unstubAllGlobals();
	});
});
