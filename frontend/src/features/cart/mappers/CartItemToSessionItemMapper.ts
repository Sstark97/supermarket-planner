import type { CartItem } from "@/store/cartStore";
import type { SaveShoppingSessionRequest } from "@/lib/http/ShoppingSessionGateway";

export class CartItemToSessionItemMapper {
	static toSessionItems(
		items: CartItem[],
	): SaveShoppingSessionRequest["items"] {
		return items.map((item) => ({
			productName: item.product.name,
			supermarket: item.product.supermarket,
			category: item.product.category,
			price: item.product.price,
			pricePerUnit: item.product.pricePerUnit,
			unit: item.product.unit,
			taxType: item.product.taxType,
			quantity: item.quantity,
			image: item.product.image,
			url: item.product.url,
		}));
	}
}
