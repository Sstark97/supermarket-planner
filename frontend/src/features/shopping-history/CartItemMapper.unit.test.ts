import { describe, expect, it } from "vitest";
import { ProductCategory, type IProduct } from "@/types";
import { CartItem } from "@/store/cartStore";
import { CartItemMapper } from "./CartItemMapper";

function makeProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    id: "product-1",
    name: "Leche entera",
    supermarket: "Mercadona",
    category: ProductCategory.DAIRY,
    price: 1.05,
    pricePerUnit: 1.05,
    unit: "l",
    taxType: "IGIC",
    scrapedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCartItem(product: IProduct, quantity = 1): CartItem {
  return {
    itemKey: `${product.supermarket}:${product.id}`,
    product,
    quantity,
  };
}

describe("CartItemMapper", () => {
  it("maps a single CartItem to the correct session item format", () => {
    const product = makeProduct({ image: "https://example.com/milk.jpg", url: "https://example.com/milk" });
    const cartItem = makeCartItem(product, 2);

    const [sessionItem] = CartItemMapper.toSessionItems([cartItem]);

    expect(sessionItem.productName).toBe("Leche entera");
    expect(sessionItem.supermarket).toBe("Mercadona");
    expect(sessionItem.category).toBe(ProductCategory.DAIRY);
    expect(sessionItem.price).toBe(1.05);
    expect(sessionItem.pricePerUnit).toBe(1.05);
    expect(sessionItem.unit).toBe("l");
    expect(sessionItem.taxType).toBe("IGIC");
    expect(sessionItem.quantity).toBe(2);
    expect(sessionItem.image).toBe("https://example.com/milk.jpg");
    expect(sessionItem.url).toBe("https://example.com/milk");
  });

  it("maps multiple CartItems preserving each item's individual data", () => {
    const milk = makeProduct({ id: "milk-1", name: "Leche entera", price: 1.05 });
    const bread = makeProduct({ id: "bread-1", name: "Pan de molde", supermarket: "Carrefour", price: 2.30, category: ProductCategory.BAKERY });

    const sessionItems = CartItemMapper.toSessionItems([
      makeCartItem(milk, 3),
      makeCartItem(bread, 1),
    ]);

    expect(sessionItems).toHaveLength(2);
    expect(sessionItems[0].productName).toBe("Leche entera");
    expect(sessionItems[0].quantity).toBe(3);
    expect(sessionItems[1].productName).toBe("Pan de molde");
    expect(sessionItems[1].supermarket).toBe("Carrefour");
    expect(sessionItems[1].quantity).toBe(1);
  });

  it("omits optional image and url fields when the product has none", () => {
    const product = makeProduct({ image: undefined, url: undefined });
    const [sessionItem] = CartItemMapper.toSessionItems([makeCartItem(product)]);

    expect(sessionItem.image).toBeUndefined();
    expect(sessionItem.url).toBeUndefined();
  });

  it("returns an empty array when given an empty cart", () => {
    const result = CartItemMapper.toSessionItems([]);
    expect(result).toHaveLength(0);
  });
});
