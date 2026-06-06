import { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";
import { ShoppingSessionHttpClient } from "@/lib/http/ShoppingSessionHttpClient";
import { CartMergeGateway } from "@/lib/http/CartMergeGateway";
import { CartMergeHttpClient } from "@/lib/http/CartMergeHttpClient";
import { ProductGateway } from "@/lib/http/ProductGateway";
import { ProductHttpClient } from "@/lib/http/ProductHttpClient";

export class ClientContainerDI {
	resolveProductGateway(): ProductGateway {
		return new ProductHttpClient("");
	}

	resolveShoppingSessionGateway(): ShoppingSessionGateway {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
		return new ShoppingSessionHttpClient(backendUrl);
	}

	resolveCartMergeGateway(): CartMergeGateway {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
		return new CartMergeHttpClient(backendUrl);
	}
}
