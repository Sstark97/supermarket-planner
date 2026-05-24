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

import { CarrefourScraper } from "./CarrefourScraper";

describe("CarrefourScraper", () => {
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

		const scraper = new CarrefourScraper();

		await expect(scraper.search("leche")).rejects.toThrow("captcha detected");
		expect(goto).toHaveBeenCalledTimes(2);
		expect(addCookies).toHaveBeenCalledOnce();
		expect(closePage).toHaveBeenCalledOnce();
		expect(closeContext).toHaveBeenCalledOnce();
		expect(fsMocks.mkdir).not.toHaveBeenCalled();
	});

	it("captures screenshot and html when timeout-like failures happen", async () => {
		waitForResponse.mockRejectedValueOnce(
			new Error("Timeout 15000ms exceeded"),
		);

		const scraper = new CarrefourScraper();

		await expect(scraper.search("leche")).rejects.toThrow(
			"Timeout 15000ms exceeded",
		);
		expect(fsMocks.mkdir).toHaveBeenCalledOnce();
		expect(screenshot).toHaveBeenCalledOnce();
		expect(fsMocks.writeFile).toHaveBeenCalledOnce();
	});

	it("captures debug artifacts when cookie selector cannot be found", async () => {
		click.mockRejectedValue(new Error("selector missing"));

		const scraper = new CarrefourScraper();

		await expect(scraper.search("leche")).rejects.toThrow(
			"Missing selector: cookie banner accept button",
		);
		expect(fsMocks.mkdir).toHaveBeenCalledOnce();
		expect(screenshot).toHaveBeenCalledOnce();
		expect(fsMocks.writeFile).toHaveBeenCalledOnce();
		expect(addCookies).not.toHaveBeenCalled();
		expect(goto).toHaveBeenCalledTimes(1);
	});
});
