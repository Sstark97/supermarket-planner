import {
	MercadonaHeaderValidationError,
	validateMercadonaHeaders,
	type MercadonaHeaders,
} from "./MercadonaHeaders";
import type { MercadonaSearchRequest, MercadonaSearchResponse } from "./types";

const MERCADONA_SEARCH_URL = "https://api2.mercadona.es/api/search/";

interface MercadonaHttpClientDeps {
	fetchFn?: typeof fetch;
	sleepFn?: (ms: number) => Promise<void>;
	timeoutMs?: number;
	retries?: number;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
	return status === 429 || status >= 500;
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

function isValidSearchResponse(
	payload: unknown,
): payload is MercadonaSearchResponse {
	if (!payload || typeof payload !== "object") {
		return false;
	}

	const withResults = payload as { results?: unknown };
	return Array.isArray(withResults.results);
}

export class MercadonaHttpClient {
	private readonly fetchFn: typeof fetch;
	private readonly sleepFn: (ms: number) => Promise<void>;
	private readonly timeoutMs: number;
	private readonly retries: number;

	constructor(deps: MercadonaHttpClientDeps = {}) {
		this.fetchFn = deps.fetchFn ?? fetch;
		this.sleepFn = deps.sleepFn ?? sleep;
		this.timeoutMs = deps.timeoutMs ?? 10_000;
		this.retries = deps.retries ?? 2;
	}

	async search(
		request: MercadonaSearchRequest,
		headers: MercadonaHeaders,
	): Promise<MercadonaSearchResponse> {
		validateMercadonaHeaders(headers);

		let attempt = 0;

		while (attempt <= this.retries) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

			try {
				const response = await this.fetchFn(MERCADONA_SEARCH_URL, {
					method: "POST",
					headers,
					body: JSON.stringify(request),
					signal: controller.signal,
				});

				if (!response.ok) {
					if (isRetryableStatus(response.status) && attempt < this.retries) {
						attempt += 1;
						await this.sleepFn(attempt * 300);
						continue;
					}

					throw new Error(
						`Mercadona API request failed with status ${response.status}`,
					);
				}

				const payload = await response.json();
				if (!isValidSearchResponse(payload)) {
					throw new Error(
						"Invalid Mercadona API response shape: results must be an array",
					);
				}

				return payload;
			} catch (error) {
				const canRetry =
					(isAbortError(error) || error instanceof TypeError) &&
					attempt < this.retries;
				if (canRetry) {
					attempt += 1;
					await this.sleepFn(attempt * 300);
					continue;
				}

				if (error instanceof MercadonaHeaderValidationError) {
					throw error;
				}

				throw error;
			} finally {
				clearTimeout(timeout);
			}
		}

		throw new Error("Mercadona API request failed after retries");
	}
}
