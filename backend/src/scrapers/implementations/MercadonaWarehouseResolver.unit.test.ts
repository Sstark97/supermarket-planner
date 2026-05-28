import { describe, expect, it, vi } from "vitest";
import {
	DEFAULT_MERCADONA_WH_LAS_PALMAS,
	resolveMercadonaWarehouse,
} from "./MercadonaWarehouseResolver";

describe("MercadonaWarehouseResolver", () => {
	it("uses configured Las Palmas warehouse when numeric string", () => {
		const resolved = resolveMercadonaWarehouse("35010", {
			env: { MERCADONA_WH_LAS_PALMAS: "9999" },
			warn: vi.fn(),
		});

		expect(resolved).toBe("9999");
	});

	it("falls back to 3544 when config is missing", () => {
		const warn = vi.fn();

		const resolved = resolveMercadonaWarehouse("35010", {
			env: {},
			warn,
		});

		expect(resolved).toBe(DEFAULT_MERCADONA_WH_LAS_PALMAS);
		expect(warn).toHaveBeenCalledOnce();
	});

	it("falls back to 3544 when config is invalid", () => {
		const warn = vi.fn();

		const resolved = resolveMercadonaWarehouse("35010", {
			env: { MERCADONA_WH_LAS_PALMAS: "abc" },
			warn,
		});

		expect(resolved).toBe(DEFAULT_MERCADONA_WH_LAS_PALMAS);
		expect(warn).toHaveBeenCalledOnce();
	});
});
