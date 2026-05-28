import { describe, expect, it } from "vitest";
import {
	buildMercadonaHeaders,
	MercadonaHeaderValidationError,
	validateMercadonaHeaders,
} from "./MercadonaHeaders";

describe("MercadonaHeaders", () => {
	it("rejects missing mandatory headers", () => {
		expect(() => validateMercadonaHeaders({})).toThrow(
			MercadonaHeaderValidationError,
		);
	});

	it("rejects invalid Origin", () => {
		const headers = buildMercadonaHeaders({ Origin: "https://example.com" });

		expect(() => validateMercadonaHeaders(headers)).toThrow(
			"Origin must be https://tienda.mercadona.es",
		);
	});

	it("rejects unrealistic User-Agent", () => {
		const headers = buildMercadonaHeaders({ "User-Agent": "curl/8.5.0" });

		expect(() => validateMercadonaHeaders(headers)).toThrow(
			"User-Agent must look like a modern browser",
		);
	});

	it("accepts a valid realistic header set", () => {
		const headers = buildMercadonaHeaders();

		expect(() => validateMercadonaHeaders(headers)).not.toThrow();
	});

	it("accepts valid lower-case key variants", () => {
		const headers = {
			origin: "https://tienda.mercadona.es",
			"user-agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
			accept: "application/json, text/plain, */*",
			"content-type": "application/json",
			referer: "https://tienda.mercadona.es/",
			"accept-language": "es-ES,es;q=0.9",
		};

		expect(() => validateMercadonaHeaders(headers)).not.toThrow();
	});
});
