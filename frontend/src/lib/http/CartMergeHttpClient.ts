import type {
	CartMergeGateway,
	CartMergeItem,
	CartMergeResponse,
} from "./CartMergeGateway";

type CartMergeApiResponse = CartMergeResponse & {
	error?: string;
};

export class CartMergeHttpClient implements CartMergeGateway {
	constructor(private readonly baseUrl: string) {}

	async merge(items: CartMergeItem[], token: string): Promise<CartMergeResponse> {
		const url = `${this.baseUrl}/api/cart/merge`;

		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ items }),
		});

		const json = (await res.json()) as CartMergeApiResponse;

		if (!res.ok) {
			throw new Error(
				`Cart merge API error ${res.status}: ${json.error ?? "Unknown error"}`,
			);
		}

		return json;
	}
}
