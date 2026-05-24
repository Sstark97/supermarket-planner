import { beforeEach, describe, expect, it, vi } from "vitest";

const closePage = vi.fn().mockResolvedValue(undefined);
const closeContext = vi.fn().mockResolvedValue(undefined);
const waitForResponse = vi.fn();
const goto = vi.fn().mockResolvedValue(undefined);

vi.mock("../strategies/StealthHelper", () => ({
	getRandomUserAgent: vi.fn(() => "test-ua"),
	randomDelay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../strategies/BrowserManager", () => ({
	BrowserManager: {
		getInstance: vi.fn(() => ({
			getContext: vi.fn().mockResolvedValue({
				addCookies: vi.fn().mockResolvedValue(undefined),
				newPage: vi.fn().mockResolvedValue({
					waitForResponse,
					goto,
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
	});

	it("rethrows interception/navigation failures so base circuit can count them", async () => {
		waitForResponse.mockRejectedValueOnce(new Error("captcha detected"));

		const scraper = new CarrefourScraper();

		await expect(scraper.search("leche")).rejects.toThrow("captcha detected");
		expect(goto).toHaveBeenCalledOnce();
		expect(closePage).toHaveBeenCalledOnce();
		expect(closeContext).toHaveBeenCalledOnce();
	});
});
