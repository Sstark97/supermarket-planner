import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ProductCategory,
	type IProduct,
} from "../../../../../domain/entities/IProduct";
import type { ProductMapper } from "../../../../../domain/services/ProductMappingPolicy";

const mocks = vi.hoisted(() => ({
	closePage: vi.fn().mockResolvedValue(undefined),
	closeContext: vi.fn().mockResolvedValue(undefined),
	goto: vi.fn().mockResolvedValue(undefined),
	waitForSelector: vi.fn().mockResolvedValue(undefined),
	evaluate: vi.fn(),
	blockUnnecessaryResources: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../categorization/ProductCategorizer", () => ({
	categorize: vi.fn().mockResolvedValue(ProductCategory.OTHER),
}));

vi.mock("../strategies/StealthHelper", () => ({
	getRandomUserAgent: vi.fn(() => "test-ua"),
	randomDelay: vi.fn().mockResolvedValue(undefined),
	blockUnnecessaryResources: mocks.blockUnnecessaryResources,
}));

vi.mock("../strategies/BrowserManager", () => ({
	BrowserManager: {
		getInstance: vi.fn(() => ({
			getContext: vi.fn().mockResolvedValue({
				newPage: vi.fn().mockResolvedValue({
					goto: mocks.goto,
					waitForSelector: mocks.waitForSelector,
					evaluate: mocks.evaluate,
					close: mocks.closePage,
				}),
				close: mocks.closeContext,
			}),
		})),
	},
}));

import { LidlScraperAdapter } from "./LidlScraperAdapter";

describe("LidlScraperAdapter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.goto.mockResolvedValue(undefined);
		mocks.waitForSelector.mockResolvedValue(undefined);
		mocks.evaluate.mockResolvedValue([]);
		mocks.blockUnnecessaryResources.mockResolvedValue(undefined);
	});

	it("maps valid DOM cards and filters incomplete rows", async () => {
		mocks.evaluate.mockResolvedValueOnce([
			{
				name: "Leche Entera",
				price: "1,25 €",
				image: "https://img/lidl-leche.jpg",
				link: "https://www.lidl.es/leche",
				unit: "1 L",
			},
			{
				name: "",
				price: "2,00 €",
				image: "",
				link: "",
				unit: "1 ud",
			},
		]);

		const mapper = {
			toDomain: vi.fn(
				(input) =>
					({
						id: "lidl-1",
						name: input.name,
						supermarket: input.supermarket,
						category: input.category,
						price: 1.25,
						pricePerUnit: 1.25,
						unit: "L",
						image: input.image,
						url: input.url,
						taxType: "UNKNOWN",
						scrapedAt: new Date().toISOString(),
					}) satisfies IProduct,
			),
		} as unknown as ProductMapper;

		const scraper = new LidlScraperAdapter(mapper);
		const results = await scraper.search("leche");

		expect(mocks.blockUnnecessaryResources).toHaveBeenCalledOnce();
		expect(mocks.goto).toHaveBeenCalledOnce();
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Leche Entera");
		expect(mapper.toDomain).toHaveBeenCalledOnce();
		expect(mocks.closePage).toHaveBeenCalledOnce();
		expect(mocks.closeContext).toHaveBeenCalledOnce();
	});
});
