import { describe, expect, it } from "vitest";
import { ProductNameNormalizer } from "./ProductNameNormalizer";

describe("ProductNameNormalizer", () => {
	describe("lowercase folding", () => {
		it("should convert uppercase letters to lowercase", () => {
			expect(ProductNameNormalizer.normalize("LECHE ENTERA")).toBe(
				"leche entera",
			);
		});

		it("should convert mixed-case strings to lowercase", () => {
			expect(ProductNameNormalizer.normalize("Leche Entera")).toBe(
				"leche entera",
			);
		});
	});

	describe("accent stripping", () => {
		it("should remove acute accents from Spanish vowels", () => {
			expect(ProductNameNormalizer.normalize("Atún en aceite")).toBe(
				"atun en aceite",
			);
		});

		it("should remove accents from all accented vowels in a product name", () => {
			expect(ProductNameNormalizer.normalize("Plátanos de Canarias")).toBe(
				"platanos de canarias",
			);
		});

		it("should handle ñ by keeping it as n after NFD normalization", () => {
			// ñ decomposes to n + combining tilde under NFD; the combining char is stripped
			expect(ProductNameNormalizer.normalize("Piñones tostados")).toBe(
				"pinones tostados",
			);
		});

		it("should strip accents from product names with multiple diacritics", () => {
			expect(
				ProductNameNormalizer.normalize("Café con Leche Azúcar"),
			).toBe("cafe con leche azucar");
		});
	});

	describe("whitespace trimming", () => {
		it("should trim leading whitespace", () => {
			expect(ProductNameNormalizer.normalize("  leche entera")).toBe(
				"leche entera",
			);
		});

		it("should trim trailing whitespace", () => {
			expect(ProductNameNormalizer.normalize("leche entera  ")).toBe(
				"leche entera",
			);
		});

		it("should trim both leading and trailing whitespace", () => {
			expect(ProductNameNormalizer.normalize("  leche entera  ")).toBe(
				"leche entera",
			);
		});
	});

	describe("weights and quantities are preserved", () => {
		it("should preserve numeric quantities in grams", () => {
			const result = ProductNameNormalizer.normalize("Patatas fritas 150g");
			expect(result).toBe("patatas fritas 150g");
		});

		it("should preserve numeric quantities in liters", () => {
			const result = ProductNameNormalizer.normalize("Leche entera 1L");
			expect(result).toBe("leche entera 1l");
		});

		it("should preserve pack sizes", () => {
			const result = ProductNameNormalizer.normalize("Papel higiénico 12 rollos");
			expect(result).toBe("papel higienico 12 rollos");
		});

		it("should treat two names differing only in quantity as distinct strings", () => {
			const normalized150 = ProductNameNormalizer.normalize(
				"Patatas fritas bolsa 150g",
			);
			const normalized200 = ProductNameNormalizer.normalize(
				"Patatas fritas bolsa 200g",
			);
			expect(normalized150).not.toBe(normalized200);
		});
	});

	describe("idempotency", () => {
		it("should produce the same result when applied twice", () => {
			const name = "Bebida de Avena sin Azúcar";
			const firstPass = ProductNameNormalizer.normalize(name);
			const secondPass = ProductNameNormalizer.normalize(firstPass);
			expect(firstPass).toBe(secondPass);
		});
	});

	describe("edge cases", () => {
		it("should return an empty string when given an empty string", () => {
			expect(ProductNameNormalizer.normalize("")).toBe("");
		});

		it("should return a single space trimmed to empty string", () => {
			expect(ProductNameNormalizer.normalize("   ")).toBe("");
		});

		it("should handle a name that is already normalized without mutation", () => {
			expect(ProductNameNormalizer.normalize("leche entera")).toBe(
				"leche entera",
			);
		});
	});
});
