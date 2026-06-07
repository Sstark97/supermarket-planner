import { describe, expect, it } from "vitest";
import { ProductSearchFiltersMapper } from "./filters";

describe("ProductSearchFiltersMapper", () => {
	const mapper = new ProductSearchFiltersMapper();

	it("should parse postalCode from search params", () => {
		const params = new URLSearchParams({ postalCode: "35001" });

		const filters = mapper.parse(params);

		expect(filters.postalCode).toBe("35001");
	});

	it("should include postalCode in toSearchParams output", () => {
		const params = mapper.toSearchParams({ postalCode: "35001" });

		expect(params.get("postalCode")).toBe("35001");
	});

	it("should omit postalCode when not present", () => {
		const parsedFilters = mapper.parse(new URLSearchParams());
		expect(parsedFilters.postalCode).toBeUndefined();

		const params = mapper.toSearchParams({});
		expect(params.has("postalCode")).toBe(false);
	});
});
