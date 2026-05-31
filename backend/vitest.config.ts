import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: [
			"src/**/*.test.ts",
			"src/**/*.spec.ts",
			"src/**/*.unit.test.ts",
			"src/**/*.integration.test.ts",
		],
	},
});
