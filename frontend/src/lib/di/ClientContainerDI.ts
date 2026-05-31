import { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";
import { ShoppingSessionHttpClient } from "@/lib/http/ShoppingSessionHttpClient";

export class ClientContainerDI {
	resolveShoppingSessionGateway(): ShoppingSessionGateway {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
		return new ShoppingSessionHttpClient(backendUrl);
	}
}
