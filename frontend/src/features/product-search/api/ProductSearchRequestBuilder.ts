export class ProductSearchRequestBuilder {
	constructor(private readonly apiBaseUrl: URL) {}

	buildUrl(searchParams: URLSearchParams): URL {
		const requestUrl = new URL("/search", this.apiBaseUrl);
		requestUrl.search = searchParams.toString();
		return requestUrl;
	}
}
