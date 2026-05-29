import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import supertest from "supertest";

// --- Module-level mocks must be hoisted before dynamic imports resolve ---

vi.mock("../../db/prisma", () => ({
	prisma: {
		product: {
			findMany: vi.fn().mockResolvedValue([]),
			upsert: vi.fn().mockResolvedValue({}),
			count: vi.fn().mockResolvedValue(0),
		},
	},
}));

vi.mock("../adapters/driven/scraping/strategies/BrowserManager", () => {
	const mockPage = {
		goto: vi.fn().mockResolvedValue(undefined),
		waitForSelector: vi.fn().mockResolvedValue(undefined),
		waitForResponse: vi.fn().mockResolvedValue({
			json: vi.fn().mockResolvedValue({ content: { docs: [] } }),
			url: vi.fn(() => "https://example.com"),
			status: vi.fn(() => 200),
		}),
		evaluate: vi.fn().mockResolvedValue([]),
		route: vi.fn().mockResolvedValue(undefined),
		locator: vi.fn(() => ({
			first: vi.fn(() => ({
				click: vi.fn().mockResolvedValue(undefined),
			})),
		})),
		fill: vi.fn().mockResolvedValue(undefined),
		keyboard: { press: vi.fn().mockResolvedValue(undefined) },
		$: vi.fn().mockResolvedValue(null),
		screenshot: vi.fn().mockResolvedValue(undefined),
		content: vi.fn().mockResolvedValue("<html></html>"),
		url: vi.fn(() => "https://example.com"),
		close: vi.fn().mockResolvedValue(undefined),
	};

	const mockContext = {
		addInitScript: vi.fn().mockResolvedValue(undefined),
		addCookies: vi.fn().mockResolvedValue(undefined),
		newPage: vi.fn().mockResolvedValue(mockPage),
		close: vi.fn().mockResolvedValue(undefined),
	};

	return {
		BrowserManager: {
			getInstance: vi.fn(() => ({
				getContext: vi.fn().mockResolvedValue(mockContext),
			})),
		},
	};
});

vi.mock("../adapters/driven/scraping/strategies/StealthHelper", () => ({
	getRandomUserAgent: vi.fn(() => "test-user-agent"),
	randomDelay: vi.fn().mockResolvedValue(undefined),
	blockUnnecessaryResources: vi.fn().mockResolvedValue(undefined),
}));

import { BackendCompositionBootstrap } from "./bootstrap";
import type { BootstrappedBackendApplication } from "./bootstrap";

describe("BackendCompositionBootstrap", () => {
	let application: BootstrappedBackendApplication;

	beforeAll(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ results: [] }),
			}),
		);

		application = BackendCompositionBootstrap.createApplication();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return a configured Express application", () => {
		expect(application.app).not.toBeNull();
		expect(application.scrapers).not.toBeNull();
		expect(application.scraperCron).not.toBeNull();
		expect(typeof application.app).toBe("function");
	});

	it("should register all five supermarket scrapers", () => {
		expect(application.scrapers).toHaveLength(5);

		const scraperNames = application.scrapers.map((scraper) => scraper.name);
		expect(scraperNames).toEqual(
			expect.arrayContaining(["HiperDino", "Mercadona", "Carrefour", "Lidl", "Aldi"]),
		);
	});

	it("should register the health endpoint", async () => {
		const response = await supertest(application.app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({ status: "ok" });
	});

	it("should register the search endpoint", async () => {
		const response = await supertest(application.app)
			.get("/search")
			.query({ q: "leche" });

		expect(response.status).not.toBe(404);
	});

	it("should register the admin scrape endpoints", async () => {
		const scrapeAllResponse = await supertest(application.app)
			.post("/admin/scrape-all");

		expect(scrapeAllResponse.status).toBe(200);
		expect(scrapeAllResponse.body).toMatchObject({
			message: "Daily scrape full loop triggered in background.",
		});

		const manualScrapeResponse = await supertest(application.app)
			.post("/admin/scrape/test-query");

		expect(manualScrapeResponse.status).not.toBe(404);
	});
});
