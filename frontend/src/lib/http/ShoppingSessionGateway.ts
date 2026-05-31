export interface SaveShoppingSessionRequest {
  shoppedAt: string;
  items: Array<{
    productName: string;
    supermarket: string;
    category: string;
    price: number;
    pricePerUnit: number;
    unit: string;
    taxType: string;
    quantity: number;
    image?: string;
    url?: string;
  }>;
}

export interface SaveShoppingSessionResponse {
  sessionId: string;
  totalPrice: number;
  itemCount: number;
}

export interface ShoppingSessionGateway {
  save(
    request: SaveShoppingSessionRequest,
    token: string,
  ): Promise<SaveShoppingSessionResponse>;
}
