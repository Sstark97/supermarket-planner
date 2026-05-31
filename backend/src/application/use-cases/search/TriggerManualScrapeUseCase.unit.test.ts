import { describe, expect, it, vi } from "vitest";
import type {
	CircuitBreakerStatus,
	SupermarketSearchPort,
} from "@application/ports/outgoing/SupermarketSearchPort";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import { ProductCategory, type IProduct } from "@domain/entities/IProduct";
import { TriggerManualScrapeUseCase } from "./TriggerManualScrapeUseCase";

const silentLogger: LoggerPort = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

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

const makeCircuitStatus = (
	failureCount = 0,
	threshold = 5,
): CircuitBreakerStatus => ({
	state: failureCount >= threshold ? "open" : "closed",
	isOpen: failureCount >= threshold,
	failureCount,
	threshold,
});

describe("TriggerManualScrapeUseCase.execute", () => {
	it("captures rejected scrapers as warnings and keeps fulfilled results", async () => {
		const okScraper: SupermarketSearchPort = {
			name: "OKMarket",
			search: vi.fn().mockResolvedValue([makeProduct("Milk", "OKMarket", 1.2)]),
			isCircuitOpen: false,
			getCircuitBreakerStatus: vi.fn(() => makeCircuitStatus(0)),
		};

		const failingScraper: SupermarketSearchPort = {
			name: "FailMarket",
			search: vi.fn().mockRejectedValue(new Error("upstream timeout")),
			isCircuitOpen: false,
			getCircuitBreakerStatus: vi.fn(() => makeCircuitStatus(1)),
		};

		const useCase = new TriggerManualScrapeUseCase([okScraper, failingScraper], silentLogger);
		const result = await useCase.execute({ query: "milk" });

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

		const failingScraper: SupermarketSearchPort = {
			name: "JsonFail",
			search: vi.fn().mockRejectedValue(objectFailure),
			isCircuitOpen: false,
			getCircuitBreakerStatus: vi.fn(() => makeCircuitStatus(1)),
		};

		const useCase = new TriggerManualScrapeUseCase([failingScraper], silentLogger);
		const result = await useCase.execute({ query: "rice" });

		expect(result.results).toEqual([]);
		expect(result.warnings).toEqual([
			'JsonFail: {"code":"RATE_LIMIT","retryInSeconds":30}',
		]);
	});
});
