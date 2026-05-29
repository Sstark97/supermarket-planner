export class ProductSearchApiUrlPolicy {
	private readonly allowedOrigins = new Set([
		"http://localhost:3000",
		"http://backend:3000",
	]);

	resolveApiUrl(): URL {
		const configuredUrl = process.env.API_URL || "http://localhost:3000";
		const parsedUrl = new URL(configuredUrl);

		if (!this.allowedOrigins.has(parsedUrl.origin)) {
			throw new Error(
				`API_URL origin not allowed: ${parsedUrl.origin}. Allowed origins: ${Array.from(this.allowedOrigins).join(", ")}`,
			);
		}

		return parsedUrl;
	}
}
