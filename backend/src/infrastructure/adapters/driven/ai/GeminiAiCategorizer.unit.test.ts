import { describe, expect, it, vi } from "vitest";
import { GeminiAiCategorizer } from "./GeminiAiCategorizer";
import type { GeminiClient } from "./GeminiAiCategorizer";
import { ProductCategory } from "@domain/entities/IProduct";

function buildCategorizerWithResponse(responseText: string): GeminiAiCategorizer {
	const mockModel = {
		generateContent: vi.fn().mockResolvedValue({
			response: { text: () => responseText },
		}),
	};
	const mockClient: GeminiClient = {
		getGenerativeModel: () => mockModel,
	};

	return new GeminiAiCategorizer({
		apiKey: "test-key",
		model: "gemini-pro",
		clientFactory: () => mockClient,
	});
}

function capturePrompt(): { categorizer: GeminiAiCategorizer; getPrompt: () => string } {
	let capturedPrompt = "";
	const mockModel = {
		generateContent: vi.fn().mockImplementation((prompt: string) => {
			capturedPrompt = prompt;
			return Promise.resolve({ response: { text: () => "snacks" } });
		}),
	};
	const mockClient: GeminiClient = {
		getGenerativeModel: () => mockModel,
	};
	const categorizer = new GeminiAiCategorizer({
		apiKey: "test-key",
		model: "gemini-pro",
		clientFactory: () => mockClient,
	});
	return { categorizer, getPrompt: () => capturedPrompt };
}

describe("GeminiAiCategorizer", () => {
	describe("prompt content", () => {
		it("should include category definitions in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Patatas fritas");

			const prompt = getPrompt();
			expect(prompt).toContain("Category definitions");
		});

		it("should include the frozen boundary definition in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Gambas congeladas");

			const prompt = getPrompt();
			expect(prompt).toContain("frozen");
			expect(prompt).toContain("congelado");
		});

		it("should include the canned_goods vs fish disambiguation in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Atun en aceite");

			const prompt = getPrompt();
			expect(prompt).toContain("canned_goods");
			expect(prompt).toContain("en conserva");
		});

		it("should include the fruits_veg vs condiments disambiguation in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Tomate frito");

			const prompt = getPrompt();
			expect(prompt).toContain("fruits_veg");
			expect(prompt).toContain("condiments");
			expect(prompt).toContain("Tomate frito");
		});

		it("should include the pasta boundary disambiguation in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Pasta de dientes");

			const prompt = getPrompt();
			expect(prompt).toContain("personal_care");
			expect(prompt).toContain("cereals_pasta");
			expect(prompt).toContain("pasta");
		});

		it("should include the papel boundary disambiguation in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Papel de cocina");

			const prompt = getPrompt();
			expect(prompt).toContain("cleaning");
			expect(prompt).toContain("papel de cocina");
		});

		it("should include plant-based milk categorized as dairy in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Bebida de avena");

			const prompt = getPrompt().toLowerCase();
			expect(prompt).toContain("dairy");
			expect(prompt).toContain("bebida de avena");
		});

		it("should include chocolate a la taza categorized as drinks in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Chocolate a la taza");

			const prompt = getPrompt().toLowerCase();
			expect(prompt).toContain("drinks");
			expect(prompt).toContain("chocolate a la taza");
		});

		it("should include the product name in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Sardinas en lata");

			expect(getPrompt()).toContain("Sardinas en lata");
		});

		it("should include all valid category values in the prompt", async () => {
			const { categorizer, getPrompt } = capturePrompt();
			await categorizer.categorize("Cualquier producto");

			const prompt = getPrompt();
			for (const category of Object.values(ProductCategory)) {
				expect(prompt).toContain(category);
			}
		});
	});

	describe("response parsing", () => {
		it("should return the matching ProductCategory when the AI responds with a valid value", async () => {
			const categorizer = buildCategorizerWithResponse("snacks");
			const result = await categorizer.categorize("Patatas fritas");
			expect(result).toBe(ProductCategory.SNACKS);
		});

		it("should return the matching category when the AI response has leading/trailing whitespace", async () => {
			const categorizer = buildCategorizerWithResponse("  dairy  ");
			const result = await categorizer.categorize("Leche entera");
			expect(result).toBe(ProductCategory.DAIRY);
		});

		it("should return undefined when the AI responds with an unknown category value", async () => {
			const categorizer = buildCategorizerWithResponse("comida");
			const result = await categorizer.categorize("Producto raro");
			expect(result).toBeUndefined();
		});

		it("should return undefined when the AI responds with an empty string", async () => {
			const categorizer = buildCategorizerWithResponse("");
			const result = await categorizer.categorize("Producto");
			expect(result).toBeUndefined();
		});
	});

	describe("API key guard", () => {
		it("should return undefined without calling the API when apiKey is empty", async () => {
			const mockClient: GeminiClient = {
				getGenerativeModel: vi.fn(),
			};
			const categorizer = new GeminiAiCategorizer({
				apiKey: "",
				model: "gemini-pro",
				clientFactory: () => mockClient,
			});

			const result = await categorizer.categorize("Patatas fritas");
			expect(result).toBeUndefined();
			expect(mockClient.getGenerativeModel).not.toHaveBeenCalled();
		});
	});

	describe("error handling", () => {
		it("should return undefined and not throw when the Gemini API call fails", async () => {
			const mockModel = {
				generateContent: vi.fn().mockRejectedValue(new Error("API error")),
			};
			const mockClient: GeminiClient = {
				getGenerativeModel: () => mockModel,
			};
			const categorizer = new GeminiAiCategorizer({
				apiKey: "test-key",
				model: "gemini-pro",
				clientFactory: () => mockClient,
			});

			const result = await categorizer.categorize("Patatas fritas");
			expect(result).toBeUndefined();
		});
	});
});
