import { afterEach, describe, expect, it, vi } from "vitest";
import { AldiScraper } from "./AldiScraper";

const okJsonResponse = (results: unknown[]) => ({
	ok: true,
	statusText: "OK",
	json: vi.fn().mockResolvedValue({ results }),
});

describe("AldiScraper", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

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
	});

	it("sends Canary indices with facet filters", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				okJsonResponse([
					{ hits: [{ productName: "Leche", salesPrice: 1.99 }] },
					{ hits: [] },
				]),
			);
		vi.stubGlobal("fetch", fetchMock);

		const scraper = new AldiScraper();
		await scraper.search("leche");

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
		const body = JSON.parse(String(requestInit.body));
		expect(
			body.requests.map((request: { indexName: string }) => request.indexName),
		).toEqual(["prod_es_es_can_offers", "prod_es_es_can_assortment"]);
		expect(body.requests[0].params).toContain("facetFilters=");
		expect(body.requests[0].params).toContain("storeID%3AES005006");
	});

	it("falls back to unfiltered query when filtered request returns no hits", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(okJsonResponse([{ hits: [] }, { hits: [] }]))
			.mockResolvedValueOnce(
				okJsonResponse([
					{ hits: [{ productName: "Leche", salesPrice: 1.25 }] },
					{ hits: [] },
				]),
			);
		vi.stubGlobal("fetch", fetchMock);

		const scraper = new AldiScraper();
		const results = await scraper.search("leche");

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const firstBody = JSON.parse(
			String((fetchMock.mock.calls[0][1] as RequestInit).body),
		);
		const secondBody = JSON.parse(
			String((fetchMock.mock.calls[1][1] as RequestInit).body),
		);
		expect(firstBody.requests[0].params).toContain("facetFilters=");
		expect(secondBody.requests[0].params).not.toContain("facetFilters=");
		expect(results.length).toBe(1);
	});
});
