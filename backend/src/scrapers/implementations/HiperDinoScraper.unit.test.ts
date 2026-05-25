import { describe, expect, it } from "vitest";
import { extractHiperDinoUnit } from "./HiperDinoScraper";

describe("extractHiperDinoUnit", () => {
	it("extracts volume/weight from secondary description text", () => {
		const unit = extractHiperDinoUnit("Leche Entera", [
			"Leche Entera",
			"Botella 1 L",
		]);

		expect(unit).toBe("Botella 1 L");
	});

	it("falls back to first secondary text when pattern is unknown", () => {
		const unit = extractHiperDinoUnit("Pan Integral", [
			"Pan Integral",
			"Formato familiar",
		]);

		expect(unit).toBe("Formato familiar");
	});
});
