import { describe, expect, it } from "vitest";
import { PostalCode } from "./PostalCode";

describe("PostalCode.create", () => {
	it("creates a postal code from a valid 5-digit Spanish code", () => {
		const postalCode = PostalCode.create("35001");

		expect(postalCode.value).toBe("35001");
		expect(postalCode.toString()).toBe("35001");
	});

	it("accepts postal codes across the valid Spanish province ranges", () => {
		expect(() => PostalCode.create("01001")).not.toThrow();
		expect(() => PostalCode.create("28001")).not.toThrow();
		expect(() => PostalCode.create("52001")).not.toThrow();
	});

	it("rejects codes outside the valid Spanish province ranges", () => {
		expect(() => PostalCode.create("00001")).toThrow(
			'Invalid Spanish postal code: "00001"',
		);
		expect(() => PostalCode.create("53001")).toThrow(
			'Invalid Spanish postal code: "53001"',
		);
	});

	it("rejects codes that are not exactly five digits", () => {
		expect(() => PostalCode.create("3500")).toThrow();
		expect(() => PostalCode.create("350011")).toThrow();
		expect(() => PostalCode.create("3500a")).toThrow();
	});
});

describe("PostalCode.equals", () => {
	it("returns true when both postal codes carry the same value", () => {
		const first = PostalCode.create("35001");
		const second = PostalCode.create("35001");

		expect(first.equals(second)).toBe(true);
	});

	it("returns false when postal codes carry different values", () => {
		const first = PostalCode.create("35001");
		const second = PostalCode.create("35010");

		expect(first.equals(second)).toBe(false);
	});
});

describe("PostalCode.DEFAULT", () => {
	it("exposes the default postal code for Las Palmas de Gran Canaria", () => {
		expect(PostalCode.DEFAULT.value).toBe("35001");
	});
});
