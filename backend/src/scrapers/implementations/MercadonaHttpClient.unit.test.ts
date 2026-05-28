import { describe, expect, it, vi } from "vitest";
import { MercadonaHttpClient } from "./MercadonaHttpClient";
import { buildMercadonaHeaders } from "./MercadonaHeaders";

describe("MercadonaHttpClient", () => {
	it("posts to search endpoint with query/offset/limit/wh", async () => {
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ results: [] }),
		});

		const client = new MercadonaHttpClient({
			fetchFn,
			sleepFn: vi.fn().mockResolvedValue(undefined),
			timeoutMs: 10_000,
		});

		await client.search(
			{
				query: "leche",
				offset: 0,
				limit: 24,
				wh: "3544",
			},
			buildMercadonaHeaders(),
		);

		expect(fetchFn).toHaveBeenCalledWith(
			"https://api2.mercadona.es/api/search/",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					query: "leche",
					offset: 0,
					limit: 24,
					wh: "3544",
				}),
			}),
		);
	});

	it("supports alternate payload values without hardcoded defaults", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });

		const client = new MercadonaHttpClient({
			fetchFn,
			sleepFn: vi.fn().mockResolvedValue(undefined),
			timeoutMs: 10_000,
		});

		await client.search(
			{
				query: "aceite oliva",
				offset: 12,
				limit: 12,
				wh: "9999",
			},
			buildMercadonaHeaders(),
		);

		expect(fetchFn).toHaveBeenCalledWith(
			"https://api2.mercadona.es/api/search/",
			expect.objectContaining({
				body: JSON.stringify({
					query: "aceite oliva",
					offset: 12,
					limit: 12,
					wh: "9999",
				}),
			}),
		);
	});

	it("retries on timeout and succeeds on next attempt", async () => {
		const fetchFn = vi
			.fn()
			.mockRejectedValueOnce(new DOMException("aborted", "AbortError"))
			.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });

		const sleepFn = vi.fn().mockResolvedValue(undefined);
		const client = new MercadonaHttpClient({
			fetchFn,
			sleepFn,
			timeoutMs: 10_000,
		});

		await client.search(
			{ query: "arroz", offset: 0, limit: 24, wh: "3544" },
			buildMercadonaHeaders(),
		);

		expect(fetchFn).toHaveBeenCalledTimes(2);
		expect(sleepFn).toHaveBeenCalledTimes(1);
	});

	it("retries on 429 and 5xx", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
			.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });

		const client = new MercadonaHttpClient({
			fetchFn,
			sleepFn: vi.fn().mockResolvedValue(undefined),
			timeoutMs: 10_000,
		});

		await client.search(
			{ query: "pan", offset: 0, limit: 24, wh: "3544" },
			buildMercadonaHeaders(),
		);

		expect(fetchFn).toHaveBeenCalledTimes(3);
	});

	it("does not retry on non-429 4xx", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
		const sleepFn = vi.fn().mockResolvedValue(undefined);

		const client = new MercadonaHttpClient({
			fetchFn,
			sleepFn,
			timeoutMs: 10_000,
		});

		await expect(
			client.search(
				{ query: "queso", offset: 0, limit: 24, wh: "3544" },
				buildMercadonaHeaders(),
			),
		).rejects.toThrow("Mercadona API request failed with status 400");

		expect(fetchFn).toHaveBeenCalledTimes(1);
		expect(sleepFn).not.toHaveBeenCalled();
	});

	it("throws on invalid response shape when results is missing or non-array", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ results: "invalid" }),
			});

		const client = new MercadonaHttpClient({
			fetchFn,
			sleepFn: vi.fn().mockResolvedValue(undefined),
			timeoutMs: 10_000,
			retries: 0,
		});

		await expect(
			client.search(
				{ query: "huevos", offset: 0, limit: 24, wh: "3544" },
				buildMercadonaHeaders(),
			),
		).rejects.toThrow(
			"Invalid Mercadona API response shape: results must be an array",
		);

		await expect(
			client.search(
				{ query: "huevos", offset: 0, limit: 24, wh: "3544" },
				buildMercadonaHeaders(),
			),
		).rejects.toThrow(
			"Invalid Mercadona API response shape: results must be an array",
		);
	});
});
