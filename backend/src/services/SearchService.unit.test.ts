import { describe, expect, it, vi } from "vitest";
import { SearchService } from "./SearchService";
import type { IScraper } from "../interfaces/IScraper";
import { ProductCategory, type IProduct } from "../interfaces/IProduct";

vi.mock("../db/prisma", () => ({
	prisma: {
		product: {
			findMany: vi.fn(),
		},
	},
}));

const makeProduct = (
	name: string,
	supermarket: string,
	pricePerUnit: number,
): IProduct => ({
	id: `${supermarket}-${name}`,
	name,
	supermarket,
	category: ProductCategory.OTHER,
	price: pricePerUnit,
	pricePerUnit,
	unit: "ud",
	taxType: "UNKNOWN",
	scrapedAt: new Date().toISOString(),
});

describe("SearchService.search", () => {
	it("captures rejected scrapers as warnings and keeps fulfilled results", async () => {
		const okScraper: IScraper = {
			name: "OKMarket",
			search: vi.fn().mockResolvedValue([makeProduct("Milk", "OKMarket", 1.2)]),
		};

		const failingScraper: IScraper = {
			name: "FailMarket",
			search: vi.fn().mockRejectedValue(new Error("upstream timeout")),
		};

		const service = new SearchService([okScraper, failingScraper]);
		const result = await service.search("milk");

		expect(result.results).toHaveLength(1);
		expect(result.results[0].supermarket).toBe("OKMarket");
		expect(result.warnings).toEqual(["FailMarket: upstream timeout"]);
		expect(result.source).toBe("live");
	});

	it("formats non-Error rejection reasons safely", async () => {
		const objectFailure = {
			code: "RATE_LIMIT",
			retryInSeconds: 30,
		};

		const failingScraper: IScraper = {
			name: "JsonFail",
			search: vi.fn().mockRejectedValue(objectFailure),
		};

		const service = new SearchService([failingScraper]);
		const result = await service.search("rice");

		expect(result.results).toEqual([]);
		expect(result.warnings).toEqual([
			'JsonFail: {"code":"RATE_LIMIT","retryInSeconds":30}',
		]);
	});
});
