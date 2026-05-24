declare module "playwright-extra-plugin-stealth" {
	import type { Plugin } from "playwright-extra";

	const stealthPlugin: () => Plugin;
	export default stealthPlugin;
}
