import { beforeEach, describe, expect, it, vi } from "vitest";

const closePage = vi.fn().mockResolvedValue(undefined);
const closeContext = vi.fn().mockResolvedValue(undefined);
const waitForResponse = vi.fn();
const goto = vi.fn().mockResolvedValue(undefined);
const addCookies = vi.fn().mockResolvedValue(undefined);
const click = vi.fn().mockResolvedValue(undefined);
const screenshot = vi.fn().mockResolvedValue(undefined);
const content = vi.fn().mockResolvedValue("<html></html>");
const url = vi.fn(() => "https://www.carrefour.es/supermercado?query=leche");

const fsMocks = vi.hoisted(() => ({
	mkdir: vi.fn().mockResolvedValue(undefined),
	writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:fs/promises", () => ({
	mkdir: fsMocks.mkdir,
	writeFile: fsMocks.writeFile,
}));

vi.mock("../strategies/StealthHelper", () => ({
	getRandomUserAgent: vi.fn(() => "test-ua"),
	randomDelay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../strategies/BrowserManager", () => ({
	BrowserManager: {
		getInstance: vi.fn(() => ({
			getContext: vi.fn().mockResolvedValue({
				addCookies,
				newPage: vi.fn().mockResolvedValue({
					waitForResponse,
					goto,
					locator: vi.fn(() => ({
						first: vi.fn(() => ({ click })),
					})),
					screenshot,
					content,
					url,
					close: closePage,
				}),
				close: closeContext,
			}),
		})),
	},
}));

import { CarrefourScraperAdapter } from "./CarrefourScraperAdapter";

describe("CarrefourScraperAdapter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		goto.mockResolvedValue(undefined);
		addCookies.mockResolvedValue(undefined);
		click.mockResolvedValue(undefined);
		waitForResponse.mockReset();
		screenshot.mockResolvedValue(undefined);
		content.mockResolvedValue("<html></html>");
		fsMocks.mkdir.mockResolvedValue(undefined);
		fsMocks.writeFile.mockResolvedValue(undefined);
	});

	it("rethrows interception/navigation failures so base circuit can count them", async () => {
		waitForResponse.mockRejectedValueOnce(new Error("captcha detected"));

		const scraper = new CarrefourScraperAdapter();

		await expect(scraper.search("leche", "35010")).rejects.toThrow(
			"captcha detected",
		);
		expect(goto).toHaveBeenCalledTimes(2);
		expect(addCookies).toHaveBeenCalledOnce();
		expect(addCookies).toHaveBeenCalledWith([
			expect.objectContaining({
				name: "salepoint",
				value: "0000GC||35010|A_DOMICILIO|1",
			}),
		]);
		expect(closePage).toHaveBeenCalledOnce();
		expect(closeContext).toHaveBeenCalledOnce();
		expect(fsMocks.mkdir).not.toHaveBeenCalled();
	});

	it("builds the salepoint cookie dynamically from the given postal code", async () => {
		waitForResponse.mockRejectedValueOnce(new Error("captcha detected"));

		const scraper = new CarrefourScraperAdapter();

		await expect(scraper.search("leche", "35100")).rejects.toThrow(
			"captcha detected",
		);
		expect(addCookies).toHaveBeenCalledWith([
			expect.objectContaining({
				name: "salepoint",
				value: "0000GC||35100|A_DOMICILIO|1",
			}),
		]);
	});

	it("captures screenshot and html when timeout-like failures happen", async () => {
		waitForResponse.mockRejectedValueOnce(
			new Error("Timeout 15000ms exceeded"),
		);

		const scraper = new CarrefourScraperAdapter();

		await expect(scraper.search("leche", "35010")).rejects.toThrow(
			"Timeout 15000ms exceeded",
		);
		expect(fsMocks.mkdir).toHaveBeenCalledOnce();
		expect(screenshot).toHaveBeenCalledOnce();
		expect(fsMocks.writeFile).toHaveBeenCalledOnce();
	});

	it("continues best-effort when cookie selector is missing", async () => {
		click.mockRejectedValue(new Error("selector missing"));
		waitForResponse.mockRejectedValueOnce(new Error("captcha detected"));

		const scraper = new CarrefourScraperAdapter();

		await expect(scraper.search("leche", "35010")).rejects.toThrow(
			"captcha detected",
		);
		expect(addCookies).toHaveBeenCalledOnce();
		expect(goto).toHaveBeenCalledTimes(2);
		expect(fsMocks.mkdir).not.toHaveBeenCalled();
		expect(screenshot).not.toHaveBeenCalled();
		expect(fsMocks.writeFile).not.toHaveBeenCalled();
	});
});
