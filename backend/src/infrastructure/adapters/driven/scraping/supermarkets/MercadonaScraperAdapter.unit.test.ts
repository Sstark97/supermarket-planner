import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ProductCategory,
	type IProduct,
} from "../../../../../interfaces/IProduct";
import type { ProductMapper } from "../../../../../domain/services/ProductMappingPolicy";

const addInitScript = vi.fn().mockResolvedValue(undefined);
const closePage = vi.fn().mockResolvedValue(undefined);
const closeContext = vi.fn().mockResolvedValue(undefined);
const route = vi.fn();
const goto = vi.fn().mockResolvedValue(undefined);
const waitForResponse = vi.fn();
const waitForSelector = vi.fn().mockResolvedValue(undefined);
const evaluate = vi.fn().mockResolvedValue([]);
const dollar = vi.fn().mockResolvedValue(null);
const fill = vi.fn().mockResolvedValue(undefined);
const keyboardPress = vi.fn().mockResolvedValue(undefined);

vi.mock("../../../../../utils/ProductCategorizer", () => ({
	categorize: vi.fn().mockResolvedValue(ProductCategory.OTHER),
}));

vi.mock("../strategies/StealthHelper", () => ({
	getRandomUserAgent: vi.fn(() => "test-ua"),
	randomDelay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../strategies/BrowserManager", () => ({
	BrowserManager: {
		getInstance: vi.fn(() => ({
			getContext: vi.fn().mockResolvedValue({
				addInitScript,
				newPage: vi.fn().mockResolvedValue({
					route,
					goto,
					waitForResponse,
					$: dollar,
					fill,
					keyboard: { press: keyboardPress },
					waitForSelector,
					evaluate,
					close: closePage,
				}),
				close: closeContext,
			}),
		})),
	},
}));

import { MercadonaScraperAdapter } from "./MercadonaScraperAdapter";

describe("MercadonaScraperAdapter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		addInitScript.mockResolvedValue(undefined);
		route.mockResolvedValue(undefined);
		goto.mockResolvedValue(undefined);
		waitForResponse.mockResolvedValue({ status: () => 200 });
		waitForSelector.mockResolvedValue(undefined);
		evaluate.mockResolvedValue([]);
		dollar.mockResolvedValue(null);
		fill.mockResolvedValue(undefined);
		keyboardPress.mockResolvedValue(undefined);
	});

	it("uses intercepted API results when available", async () => {
		const mapper = {
			toDomain: vi.fn(
				(input) =>
					({
						id: "mercadona-1",
						name: input.name,
						supermarket: input.supermarket,
						category: input.category,
						price: 1.5,
						pricePerUnit: 1.5,
						unit: "L",
						image: input.image,
						url: input.url,
						taxType: "IGIC",
						scrapedAt: new Date().toISOString(),
					}) satisfies IProduct,
			),
		} as unknown as ProductMapper;

		route.mockImplementationOnce(async (_pattern, handler) => {
			await handler({
				fetch: vi.fn().mockResolvedValue({
					json: vi.fn().mockResolvedValue({
						results: [
							{
								id: "1001",
								display_name: "Leche Semidesnatada",
								thumbnail: "https://img/mercadona-leche.jpg",
								price_instructions: {
									unit_price: 1.5,
									unit_size: 1,
									size_format: "L",
								},
							},
						],
					}),
				}),
				fulfill: vi.fn().mockResolvedValue(undefined),
			});
		});

		const scraper = new MercadonaScraperAdapter(mapper);
		const results = await scraper.search("leche");

		expect(addInitScript).toHaveBeenCalledOnce();
		expect(results).toHaveLength(1);
		expect(results[0].supermarket).toBe("Mercadona");
		expect(mapper.toDomain).toHaveBeenCalledOnce();
		expect(waitForSelector).not.toHaveBeenCalled();
	});

	it("falls back to DOM parsing when API intercept does not resolve", async () => {
		const mapper = {
			toDomain: vi.fn(
				(input) =>
					({
						id: "mercadona-2",
						name: input.name,
						supermarket: input.supermarket,
						category: input.category,
						price: 2.1,
						pricePerUnit: 2.1,
						unit: "kg",
						image: input.image,
						url: input.url,
						taxType: "IGIC",
						scrapedAt: new Date().toISOString(),
					}) satisfies IProduct,
			),
		} as unknown as ProductMapper;

		route.mockResolvedValueOnce(undefined);
		waitForResponse.mockRejectedValueOnce(new Error("api timeout"));
		evaluate.mockResolvedValueOnce([
			{
				name: "Papas",
				price: "2,10 €",
				image: "https://img/papas.jpg",
				unit: "1 kg",
			},
		]);

		const scraper = new MercadonaScraperAdapter(mapper);
		const results = await scraper.search("papas");

		expect(waitForSelector).toHaveBeenCalledOnce();
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Papas");
		expect(mapper.toDomain).toHaveBeenCalledOnce();
	});
});
