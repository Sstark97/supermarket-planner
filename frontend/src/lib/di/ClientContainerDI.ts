import { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";
import { ShoppingSessionHttpClient } from "@/lib/http/ShoppingSessionHttpClient";
import { CartMergeGateway } from "@/lib/http/CartMergeGateway";
import { CartMergeHttpClient } from "@/lib/http/CartMergeHttpClient";

export class ClientContainerDI {
	resolveShoppingSessionGateway(): ShoppingSessionGateway {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
		return new ShoppingSessionHttpClient(backendUrl);
	}

	resolveCartMergeGateway(): CartMergeGateway {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
		return new CartMergeHttpClient(backendUrl);
	}
}
