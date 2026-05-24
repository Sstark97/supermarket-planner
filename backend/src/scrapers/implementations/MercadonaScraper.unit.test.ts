import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductCategory, type IProduct } from "../../interfaces/IProduct";
import * as headersModule from "../mercadona/MercadonaHeaders";
import { MercadonaHttpClient } from "../mercadona/MercadonaHttpClient";
import * as mapperModule from "../mercadona/MercadonaMapper";
import * as warehouseModule from "../mercadona/MercadonaWarehouseResolver";
import type {
	MercadonaApiProduct,
	MercadonaSearchRequest,
	MercadonaSearchResponse,
} from "../mercadona/types";

const browserManagerGetInstance = vi.fn();

vi.mock("../strategies/BrowserManager", () => ({
	BrowserManager: {
		getInstance: browserManagerGetInstance,
	},
}));

import { MercadonaScraper } from "./MercadonaScraper";

describe("MercadonaScraper integration (US03 PR2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("does not use BrowserManager in standard flow", async () => {
		const expectedProducts: IProduct[] = [
			{
				id: "p1",
				name: "Leche Entera",
				supermarket: "Mercadona",
				category: ProductCategory.OTHER,
				price: 1.2,
				pricePerUnit: 1.2,
				unit: "L",
				taxType: "IGIC",
				scrapedAt: "2026-01-01T00:00:00.000Z",
			},
		];

		const scraper = new MercadonaScraper(undefined, {
			buildHeaders: () => ({
				Origin: "https://tienda.mercadona.es",
				"User-Agent": "Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36",
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
				Referer: "https://tienda.mercadona.es/",
				"Accept-Language": "es-ES,es;q=0.9",
			}),
			resolveWarehouse: vi.fn(() => "3544"),
			searchClient: vi.fn(async () => ({ results: [] })),
			mapProducts: vi.fn(async () => expectedProducts),
		});

		const result = await scraper.search("leche");

		expect(result).toEqual(expectedProducts);
		expect(browserManagerGetInstance).not.toHaveBeenCalled();
	});

	it("builds headers before dispatching HTTP search", async () => {
		const events: string[] = [];
		const headers = {
			Origin: "https://tienda.mercadona.es",
			"User-Agent": "Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36",
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json",
			Referer: "https://tienda.mercadona.es/",
			"Accept-Language": "es-ES,es;q=0.9",
		};

		const scraper = new MercadonaScraper(undefined, {
			buildHeaders: () => {
				events.push("build");
				return headers;
			},
			resolveWarehouse: vi.fn(() => "3544"),
			searchClient: vi.fn(async () => {
				events.push("search");
				return { results: [] };
			}),
			mapProducts: vi.fn(async () => []),
		});

		await scraper.search("pan");

		expect(events).toEqual(["build", "search"]);
	});

	it("resolves warehouse and forwards wh in request payload", async () => {
		const searchClient = vi.fn<
			(request: MercadonaSearchRequest) => Promise<MercadonaSearchResponse>
		>(async () => ({ results: [] }));

		const resolveWarehouse = vi.fn(() => "9999");

		const scraper = new MercadonaScraper(undefined, {
			buildHeaders: () => ({
				Origin: "https://tienda.mercadona.es",
				"User-Agent": "Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36",
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
				Referer: "https://tienda.mercadona.es/",
				"Accept-Language": "es-ES,es;q=0.9",
			}),
			resolveWarehouse,
			searchClient,
			mapProducts: vi.fn(async () => []),
		});

		await scraper.search("arroz");

		expect(resolveWarehouse).toHaveBeenCalledWith("35010");
		expect(searchClient).toHaveBeenCalledWith(
			expect.objectContaining({
				query: "arroz",
				offset: 0,
				limit: 24,
				wh: "9999",
			}),
			expect.any(Object),
		);
	});

	it("returns mapper output from API results", async () => {
		const apiResults: MercadonaApiProduct[] = [
			{ id: "1", display_name: "Leche semidesnatada" },
		];
		const mapped: IProduct[] = [
			{
				id: "mapped-1",
				name: "Leche semidesnatada",
				supermarket: "Mercadona",
				category: ProductCategory.OTHER,
				price: 1.1,
				pricePerUnit: 1.1,
				unit: "L",
				taxType: "IGIC",
				scrapedAt: "2026-01-01T00:00:00.000Z",
			},
		];

		const mapProducts = vi.fn(async () => mapped);

		const scraper = new MercadonaScraper(undefined, {
			buildHeaders: () => ({
				Origin: "https://tienda.mercadona.es",
				"User-Agent": "Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36",
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
				Referer: "https://tienda.mercadona.es/",
				"Accept-Language": "es-ES,es;q=0.9",
			}),
			resolveWarehouse: vi.fn(() => "3544"),
			searchClient: vi.fn(async () => ({ results: apiResults })),
			mapProducts,
		});

		const output = await scraper.search("leche");

		expect(mapProducts).toHaveBeenCalledWith(apiResults);
		expect(output).toEqual(mapped);
	});

	it("propagates terminal HTTP client errors", async () => {
		const scraper = new MercadonaScraper(undefined, {
			buildHeaders: () => ({
				Origin: "https://tienda.mercadona.es",
				"User-Agent": "Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36",
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
				Referer: "https://tienda.mercadona.es/",
				"Accept-Language": "es-ES,es;q=0.9",
			}),
			resolveWarehouse: vi.fn(() => "3544"),
			searchClient: vi.fn(async () => {
				throw new Error("mercadona 429");
			}),
			mapProducts: vi.fn(async () => []),
		});

		await expect(scraper.search("aceite")).rejects.toThrow("mercadona 429");
	});

	it("uses default helper wiring when deps are omitted", async () => {
		const headers = {
			Origin: "https://tienda.mercadona.es",
			"User-Agent": "Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36",
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json",
			Referer: "https://tienda.mercadona.es/",
			"Accept-Language": "es-ES,es;q=0.9",
		};
		const apiResults: MercadonaApiProduct[] = [
			{ id: "77", display_name: "Atún" },
		];
		const mapped: IProduct[] = [
			{
				id: "mapped-77",
				name: "Atún",
				supermarket: "Mercadona",
				category: ProductCategory.OTHER,
				price: 3.1,
				pricePerUnit: 3.1,
				unit: "ud",
				taxType: "IGIC",
				scrapedAt: "2026-01-01T00:00:00.000Z",
			},
		];

		const buildSpy = vi
			.spyOn(headersModule, "buildMercadonaHeaders")
			.mockReturnValue(headers);
		const resolveSpy = vi
			.spyOn(warehouseModule, "resolveMercadonaWarehouse")
			.mockReturnValue("3544");
		const searchSpy = vi
			.spyOn(MercadonaHttpClient.prototype, "search")
			.mockResolvedValue({ results: apiResults });
		const mapSpy = vi
			.spyOn(mapperModule, "mapMercadonaProducts")
			.mockResolvedValue(mapped);

		const scraper = new MercadonaScraper();
		const output = await scraper.search("atun");

		expect(buildSpy).toHaveBeenCalledOnce();
		expect(resolveSpy).toHaveBeenCalledWith("35010");
		expect(searchSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				query: "atun",
				offset: 0,
				limit: 24,
				wh: "3544",
			}),
			headers,
		);
		expect(mapSpy).toHaveBeenCalledWith(apiResults);
		expect(output).toEqual(mapped);
	});
});
