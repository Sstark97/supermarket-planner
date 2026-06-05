import type {
	ListShoppingSessionsResponse,
	SaveShoppingSessionRequest,
	SaveShoppingSessionResponse,
	ShoppingSessionGateway,
} from "./ShoppingSessionGateway";

type SaveShoppingSessionApiResponse = SaveShoppingSessionResponse & {
	error?: string;
};

type ListShoppingSessionsApiResponse = ListShoppingSessionsResponse & {
	error?: string;
};

export class ShoppingSessionHttpClient implements ShoppingSessionGateway {
	constructor(private readonly baseUrl: string) {}

	async save(
		request: SaveShoppingSessionRequest,
		token: string,
	): Promise<SaveShoppingSessionResponse> {
		const url = `${this.baseUrl}/api/shopping-sessions`;

		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(request),
		});

		const json = (await res.json()) as SaveShoppingSessionApiResponse;

		if (!res.ok) {
			throw new Error(
				`Shopping session API error ${res.status}: ${json.error ?? "Unknown error"}`,
			);
		}

		return json;
	}

	async list(token: string): Promise<ListShoppingSessionsResponse> {
		const url = `${this.baseUrl}/api/shopping-sessions`;

		const res = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			cache: "no-store",
		});

		const json = (await res.json()) as ListShoppingSessionsApiResponse;

		if (!res.ok) {
			throw new Error(
				`Shopping session API error ${res.status}: ${json.error ?? "Unknown error"}`,
			);
		}

		return json;
	}
}
