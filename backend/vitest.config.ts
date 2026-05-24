import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: [
			"src/**/*.test.ts",
			"src/**/*.spec.ts",
			"src/**/*.unit.test.ts",
			"src/**/*.integration.test.ts",
		],
	},
});
