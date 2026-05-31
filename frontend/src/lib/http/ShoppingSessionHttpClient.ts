import type {
  SaveShoppingSessionRequest,
  SaveShoppingSessionResponse,
  ShoppingSessionGateway,
} from "./ShoppingSessionGateway";

type ShoppingSessionApiResponse = SaveShoppingSessionResponse & {
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

    const json = (await res.json()) as ShoppingSessionApiResponse;

    if (!res.ok) {
      throw new Error(
        `Shopping session API error ${res.status}: ${json.error ?? "Unknown error"}`,
      );
    }

    return json;
  }
}
