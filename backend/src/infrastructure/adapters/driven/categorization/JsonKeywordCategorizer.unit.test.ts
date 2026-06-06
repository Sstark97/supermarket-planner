import { describe, expect, it } from "vitest";
import { JsonKeywordCategorizer } from "./JsonKeywordCategorizer";
import { ProductCategory } from "@domain/entities/IProduct";

type KeywordRules = Record<string, ProductCategory>;
type PhraseRules = Record<string, ProductCategory>;

const MINIMAL_KEYWORDS: KeywordRules = {
	patata: ProductCategory.FRUITS_VEG,
	patatas: ProductCategory.FRUITS_VEG,
	pan: ProductCategory.BAKERY,
	tomate: ProductCategory.FRUITS_VEG,
	atun: ProductCategory.FISH,
	sardina: ProductCategory.FISH,
	mejillon: ProductCategory.FISH,
	chocolate: ProductCategory.SNACKS,
	cerveza: ProductCategory.DRINKS,
	avena: ProductCategory.CEREALS_PASTA,
	pizza: ProductCategory.FROZEN,
	helado: ProductCategory.FROZEN,
	leche: ProductCategory.DAIRY,
	detergente: ProductCategory.CLEANING,
	pienso: ProductCategory.PET,
	lata: ProductCategory.CANNED_GOODS,
};

const MINIMAL_PHRASES: PhraseRules = {
	"patatas fritas": ProductCategory.SNACKS,
	"patatas congeladas": ProductCategory.FROZEN,
	"patata congelada": ProductCategory.FROZEN,
	"verduras congeladas": ProductCategory.FROZEN,
	"verdura congelada": ProductCategory.FROZEN,
	"hamburguesas congeladas": ProductCategory.FROZEN,
	"gambas congeladas": ProductCategory.FROZEN,
	"croquetas congeladas": ProductCategory.FROZEN,
	"atun en conserva": ProductCategory.CANNED_GOODS,
	"atun en aceite": ProductCategory.CANNED_GOODS,
	"sardinas en aceite": ProductCategory.CANNED_GOODS,
	"mejillones en escabeche": ProductCategory.CANNED_GOODS,
	"tomate frito": ProductCategory.CONDIMENTS,
	"salsa de tomate": ProductCategory.CONDIMENTS,
	"tomate triturado": ProductCategory.CANNED_GOODS,
	"tomate natural triturado": ProductCategory.CANNED_GOODS,
	"pasta de dientes": ProductCategory.PERSONAL_CARE,
	"pasta fresca": ProductCategory.CEREALS_PASTA,
	"pasta integral": ProductCategory.CEREALS_PASTA,
	"papel higienico": ProductCategory.PERSONAL_CARE,
	"papel de cocina": ProductCategory.CLEANING,
	"papel de aluminio": ProductCategory.CLEANING,
	"bebida de avena": ProductCategory.DAIRY,
	"leche de soja": ProductCategory.DAIRY,
	"chocolate a la taza": ProductCategory.DRINKS,
	"lata de cerveza": ProductCategory.DRINKS,
	"latas de cerveza": ProductCategory.DRINKS,
	"pan rallado": ProductCategory.CONDIMENTS,
	"pan de molde": ProductCategory.BAKERY,
};

function buildCategorizer(): JsonKeywordCategorizer {
	return new JsonKeywordCategorizer(MINIMAL_KEYWORDS, MINIMAL_PHRASES);
}

describe("JsonKeywordCategorizer", () => {
	describe("snacks vs. frozen vs. fruits_veg (patatas boundary)", () => {
		it("should classify 'Patatas fritas onduladas' as snacks", () => {
			expect(buildCategorizer().match("Patatas fritas onduladas")).toBe("snacks");
		});

		it("should classify 'Patatas congeladas' as frozen", () => {
			expect(buildCategorizer().match("Patatas congeladas")).toBe("frozen");
		});

		it("should classify 'Patata' as fruits_veg", () => {
			expect(buildCategorizer().match("Patata")).toBe("fruits_veg");
		});

		it("should classify bare 'Patatas' as fruits_veg (not snacks after token removal)", () => {
			expect(buildCategorizer().match("Patatas")).toBe("fruits_veg");
		});
	});

	describe("frozen-qualifier heuristic", () => {
		it("should classify 'Verduras congeladas' as frozen via phrase rule", () => {
			expect(buildCategorizer().match("Verduras congeladas")).toBe("frozen");
		});

		it("should classify 'Hamburguesas congeladas' as frozen via phrase rule", () => {
			expect(buildCategorizer().match("Hamburguesas congeladas")).toBe("frozen");
		});

		it("should classify 'Gambas congeladas' as frozen via phrase rule", () => {
			expect(buildCategorizer().match("Gambas congeladas")).toBe("frozen");
		});

		it("should classify 'Croquetas de jamon congeladas' as frozen via qualifier heuristic (long tail)", () => {
			expect(buildCategorizer().match("Croquetas de jamon congeladas")).toBe(
				"frozen",
			);
		});

		it("should classify 'Filetes de merluza congelados' as frozen via qualifier heuristic", () => {
			expect(buildCategorizer().match("Filetes de merluza congelados")).toBe(
				"frozen",
			);
		});

		it("should classify 'Pechuga de pollo congelada' as frozen via qualifier heuristic", () => {
			expect(buildCategorizer().match("Pechuga de pollo congelada")).toBe(
				"frozen",
			);
		});
	});

	describe("canned_goods vs. fish (en conserva / en lata boundary)", () => {
		it("should classify 'Atun en conserva' as canned_goods", () => {
			expect(buildCategorizer().match("Atun en conserva")).toBe("canned_goods");
		});

		it("should classify 'Atun en aceite de oliva' as canned_goods", () => {
			expect(buildCategorizer().match("Atun en aceite de oliva")).toBe(
				"canned_goods",
			);
		});

		it("should classify 'Sardinas en aceite' as canned_goods", () => {
			expect(buildCategorizer().match("Sardinas en aceite")).toBe("canned_goods");
		});

		it("should classify 'Mejillones en escabeche' as canned_goods", () => {
			expect(buildCategorizer().match("Mejillones en escabeche")).toBe(
				"canned_goods",
			);
		});

		it("should classify 'Atun fresco' as fish (fresh fish stays as fish)", () => {
			expect(buildCategorizer().match("Atun fresco")).toBe("fish");
		});
	});

	describe("condiments vs. fruits_veg (tomate boundary)", () => {
		it("should classify 'Tomate frito' as condiments", () => {
			expect(buildCategorizer().match("Tomate frito")).toBe("condiments");
		});

		it("should classify 'Salsa de tomate' as condiments", () => {
			expect(buildCategorizer().match("Salsa de tomate")).toBe("condiments");
		});

		it("should classify 'Tomate triturado' as canned_goods", () => {
			expect(buildCategorizer().match("Tomate triturado")).toBe("canned_goods");
		});

		it("should classify 'Tomate natural triturado' as canned_goods (longer phrase wins)", () => {
			expect(buildCategorizer().match("Tomate natural triturado")).toBe(
				"canned_goods",
			);
		});

		it("should classify bare 'Tomate' as fruits_veg (fresh tomato stays as produce)", () => {
			expect(buildCategorizer().match("Tomate")).toBe("fruits_veg");
		});
	});

	describe("cereals_pasta vs. personal_care (pasta boundary)", () => {
		it("should classify 'Pasta de dientes blanqueadora' as personal_care", () => {
			expect(buildCategorizer().match("Pasta de dientes blanqueadora")).toBe(
				"personal_care",
			);
		});

		it("should classify 'Pasta fresca al huevo' as cereals_pasta", () => {
			expect(buildCategorizer().match("Pasta fresca al huevo")).toBe(
				"cereals_pasta",
			);
		});

		it("should classify 'Pasta integral 500g' as cereals_pasta", () => {
			expect(buildCategorizer().match("Pasta integral 500g")).toBe(
				"cereals_pasta",
			);
		});
	});

	describe("cleaning vs. personal_care (papel boundary)", () => {
		it("should classify 'Papel higienico 12 rollos' as personal_care", () => {
			expect(buildCategorizer().match("Papel higienico 12 rollos")).toBe(
				"personal_care",
			);
		});

		it("should classify 'Papel de cocina 3 rollos' as cleaning", () => {
			expect(buildCategorizer().match("Papel de cocina 3 rollos")).toBe(
				"cleaning",
			);
		});

		it("should classify 'Papel de aluminio 30m' as cleaning", () => {
			expect(buildCategorizer().match("Papel de aluminio 30m")).toBe("cleaning");
		});
	});

	describe("dairy (plant-based milks)", () => {
		it("should classify 'Bebida de avena sin azucar' as dairy", () => {
			expect(buildCategorizer().match("Bebida de avena sin azucar")).toBe(
				"dairy",
			);
		});

		it("should classify 'Leche de soja enriquecida' as dairy", () => {
			expect(buildCategorizer().match("Leche de soja enriquecida")).toBe("dairy");
		});

		it("should classify bare 'Avena' as cereals_pasta (oats stay as cereals)", () => {
			expect(buildCategorizer().match("Avena")).toBe("cereals_pasta");
		});
	});

	describe("drinks (chocolate and lata boundaries)", () => {
		it("should classify 'Chocolate a la taza' as drinks", () => {
			expect(buildCategorizer().match("Chocolate a la taza")).toBe("drinks");
		});

		it("should classify 'Chocolate con leche' as snacks (existing behavior preserved)", () => {
			expect(buildCategorizer().match("Chocolate con leche")).toBe("snacks");
		});

		it("should classify 'Lata de cerveza' as drinks (not canned_goods)", () => {
			expect(buildCategorizer().match("Lata de cerveza")).toBe("drinks");
		});

		it("should classify 'Latas de cerveza pack 6' as drinks", () => {
			expect(buildCategorizer().match("Latas de cerveza pack 6")).toBe("drinks");
		});
	});

	describe("bakery (pan rallado boundary)", () => {
		it("should classify 'Pan rallado fino' as condiments", () => {
			expect(buildCategorizer().match("Pan rallado fino")).toBe("condiments");
		});

		it("should classify 'Pan de molde sin corteza' as bakery", () => {
			expect(buildCategorizer().match("Pan de molde sin corteza")).toBe("bakery");
		});

		it("should classify bare 'Pan' as bakery (existing behavior preserved)", () => {
			expect(buildCategorizer().match("Pan")).toBe("bakery");
		});
	});

	describe("regression guards (existing behavior preserved)", () => {
		it("should classify 'Pizza' as frozen", () => {
			expect(buildCategorizer().match("Pizza")).toBe("frozen");
		});

		it("should classify 'Helado de chocolate' as frozen", () => {
			expect(buildCategorizer().match("Helado de chocolate")).toBe("frozen");
		});

		it("should classify 'Leche entera' as dairy", () => {
			expect(buildCategorizer().match("Leche entera")).toBe("dairy");
		});

		it("should classify 'Detergente para lavadora' as cleaning", () => {
			expect(buildCategorizer().match("Detergente para lavadora")).toBe(
				"cleaning",
			);
		});

		it("should classify 'Pienso para gato' as pet", () => {
			expect(buildCategorizer().match("Pienso para gato")).toBe("pet");
		});
	});

	describe("accent normalization", () => {
		it("should match phrases correctly when product name contains Spanish accents", () => {
			expect(buildCategorizer().match("Atún en conserva")).toBe("canned_goods");
		});

		it("should apply frozen-qualifier heuristic when qualifier has an accent", () => {
			expect(buildCategorizer().match("Croquetas de jamón congeladas")).toBe(
				"frozen",
			);
		});
	});

	describe("no match", () => {
		it("should return undefined when product name has no matching keyword or phrase", () => {
			expect(buildCategorizer().match("Producto desconocido xyz")).toBeUndefined();
		});
	});
});
