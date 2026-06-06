import { describe, expect, it, vi } from "vitest";
import { GeminiAiBatchCategorizer } from "./GeminiAiBatchCategorizer";
import type { GeminiBatchClient } from "./GeminiAiBatchCategorizer";
import { ProductCategory } from "@domain/entities/IProduct";

function buildCategorizerWithResponse(responseText: string): GeminiAiBatchCategorizer {
	const mockModel = {
		generateContent: vi.fn().mockResolvedValue({
			response: { text: () => responseText },
		}),
	};
	const mockClient: GeminiBatchClient = {
		getGenerativeModel: () => mockModel,
	};

	return new GeminiAiBatchCategorizer({
		apiKey: "test-key",
		model: "gemini-pro",
		clientFactory: () => mockClient,
	});
}

function capturePrompt(): {
	categorizer: GeminiAiBatchCategorizer;
	getPrompt: () => string;
} {
	let capturedPrompt = "";
	const mockModel = {
		generateContent: vi.fn().mockImplementation((prompt: string) => {
			capturedPrompt = prompt;
			return Promise.resolve({
				response: {
					text: () => JSON.stringify({ "Leche entera": "dairy" }),
				},
			});
		}),
	};
	const mockClient: GeminiBatchClient = {
		getGenerativeModel: () => mockModel,
	};
	const categorizer = new GeminiAiBatchCategorizer({
		apiKey: "test-key",
		model: "gemini-pro",
		clientFactory: () => mockClient,
	});
	return { categorizer, getPrompt: () => capturedPrompt };
}

describe("GeminiAiBatchCategorizer", () => {
	describe("prompt construction", () => {
		it("should include category definitions in the batch prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorizeBatch(["Leche entera"]);

			expect(getPrompt()).toContain("Category definitions");
		});

		it("should include all valid category values in the batch prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorizeBatch(["Leche entera"]);

			const prompt = getPrompt();
			for (const category of Object.values(ProductCategory)) {
				expect(prompt).toContain(category);
			}
		});

		it("should include each product name in the batch prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorizeBatch([
				"Leche entera",
				"Pan integral",
				"Atún en aceite",
			]);

			const prompt = getPrompt();
			expect(prompt).toContain("Leche entera");
			expect(prompt).toContain("Pan integral");
			expect(prompt).toContain("Atún en aceite");
		});

		it("should instruct Gemini to return only a JSON object without markdown", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorizeBatch(["Leche entera"]);

			expect(getPrompt()).toContain("JSON object");
			expect(getPrompt()).toContain("no markdown fences");
		});
	});

	describe("JSON response parsing", () => {
		it("should parse a valid JSON response and return a map of name to category", async () => {
			const response = JSON.stringify({
				"Leche entera": "dairy",
				"Pan integral": "bakery",
			});
			const categorizer = buildCategorizerWithResponse(response);

			const result = await categorizer.categorizeBatch([
				"Leche entera",
				"Pan integral",
			]);

			expect(result.get("Leche entera")).toBe(ProductCategory.DAIRY);
			expect(result.get("Pan integral")).toBe(ProductCategory.BAKERY);
		});

		it("should strip markdown code fences before parsing the JSON", async () => {
			const response = "```json\n" + JSON.stringify({ "Leche entera": "dairy" }) + "\n```";
			const categorizer = buildCategorizerWithResponse(response);

			const result = await categorizer.categorizeBatch(["Leche entera"]);

			expect(result.get("Leche entera")).toBe(ProductCategory.DAIRY);
		});

		it("should strip plain code fences without language tag", async () => {
			const response = "```\n" + JSON.stringify({ "Leche entera": "dairy" }) + "\n```";
			const categorizer = buildCategorizerWithResponse(response);

			const result = await categorizer.categorizeBatch(["Leche entera"]);

			expect(result.get("Leche entera")).toBe(ProductCategory.DAIRY);
		});
	});

	describe("invalid category filtering", () => {
		it("should exclude entries with category values not in the ProductCategory enum", async () => {
			const response = JSON.stringify({
				"Leche entera": "dairy",
				"Producto X": "unknown_category",
			});
			const logger = { warn: vi.fn(), error: vi.fn() };
			const mockModel = {
				generateContent: vi.fn().mockResolvedValue({
					response: { text: () => response },
				}),
			};
			const mockClient: GeminiBatchClient = { getGenerativeModel: () => mockModel };
			const categorizerWithLogger = new GeminiAiBatchCategorizer({
				apiKey: "test-key",
				model: "gemini-pro",
				clientFactory: () => mockClient,
				logger,
			});

			const result = await categorizerWithLogger.categorizeBatch([
				"Leche entera",
				"Producto X",
			]);

			expect(result.has("Leche entera")).toBe(true);
			expect(result.has("Producto X")).toBe(false);
			expect(logger.warn).toHaveBeenCalledOnce();
		});

		it("should exclude entries whose names were not in the original batch", async () => {
			const response = JSON.stringify({
				"Leche entera": "dairy",
				"Producto extra no pedido": "snacks",
			});
			const logger = { warn: vi.fn(), error: vi.fn() };
			const mockModel = {
				generateContent: vi.fn().mockResolvedValue({
					response: { text: () => response },
				}),
			};
			const mockClient: GeminiBatchClient = { getGenerativeModel: () => mockModel };
			const categorizer = new GeminiAiBatchCategorizer({
				apiKey: "test-key",
				model: "gemini-pro",
				clientFactory: () => mockClient,
				logger,
			});

			const result = await categorizer.categorizeBatch(["Leche entera"]);

			expect(result.has("Leche entera")).toBe(true);
			expect(result.has("Producto extra no pedido")).toBe(false);
			expect(logger.warn).toHaveBeenCalledOnce();
		});
	});

	describe("API key guard", () => {
		it("should return an empty map without calling the API when apiKey is empty", async () => {
			const mockClient: GeminiBatchClient = {
				getGenerativeModel: vi.fn(),
			};
			const categorizer = new GeminiAiBatchCategorizer({
				apiKey: "",
				model: "gemini-pro",
				clientFactory: () => mockClient,
			});

			const result = await categorizer.categorizeBatch(["Leche entera"]);

			expect(result.size).toBe(0);
			expect(mockClient.getGenerativeModel).not.toHaveBeenCalled();
		});

		it("should return an empty map immediately for an empty product name array", async () => {
			const mockClient: GeminiBatchClient = {
				getGenerativeModel: vi.fn(),
			};
			const categorizer = new GeminiAiBatchCategorizer({
				apiKey: "test-key",
				model: "gemini-pro",
				clientFactory: () => mockClient,
			});

			const result = await categorizer.categorizeBatch([]);

			expect(result.size).toBe(0);
			expect(mockClient.getGenerativeModel).not.toHaveBeenCalled();
		});
	});

	describe("error handling", () => {
		it("should return an empty map and not throw when the Gemini API call fails", async () => {
			const mockModel = {
				generateContent: vi.fn().mockRejectedValue(new Error("API error")),
			};
			const mockClient: GeminiBatchClient = {
				getGenerativeModel: () => mockModel,
			};
			const categorizer = new GeminiAiBatchCategorizer({
				apiKey: "test-key",
				model: "gemini-pro",
				clientFactory: () => mockClient,
			});

			const result = await categorizer.categorizeBatch(["Leche entera"]);

			expect(result.size).toBe(0);
		});

		it("should return an empty map and not throw when the response is malformed JSON", async () => {
			const categorizer = buildCategorizerWithResponse("this is not json {");
			const result = await categorizer.categorizeBatch(["Leche entera"]);

			expect(result.size).toBe(0);
		});

		it("should return an empty map when the response is a JSON array instead of an object", async () => {
			const categorizer = buildCategorizerWithResponse('["dairy"]');
			const result = await categorizer.categorizeBatch(["Leche entera"]);

			expect(result.size).toBe(0);
		});
	});
});
