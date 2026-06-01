import { describe, it, expect, vi, beforeEach } from "vitest";
import { MergeCartUseCase } from "./MergeCartUseCase";
import type { ActiveCartRepository } from "@application/ports/outgoing/ActiveCartRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { ActiveCart } from "@domain/entities/ActiveCart";
import type { MergeCartInput } from "./contracts";

const makeActiveCart = (overrides: Partial<ActiveCart> = {}): ActiveCart => ({
	id: "cart-uuid-1",
	userId: "user-123",
	updatedAt: new Date("2026-05-31"),
	items: [],
	...overrides,
});

const makeValidInput = (overrides: Partial<MergeCartInput> = {}): MergeCartInput => ({
	userId: "user-123",
	items: [
		{
			productId: "prod-uuid-1",
			productName: "Leche Entera",
			supermarket: "mercadona",
			category: "dairy",
			price: 1.05,
			pricePerUnit: 1.05,
			unit: "l",
			taxType: "IGIC",
			quantity: 2,
		},
	],
	...overrides,
});

const makeMockRepository = (): ActiveCartRepository => ({
	findByUserId: vi.fn(async () => null),
	upsert: vi.fn(async (cart: ActiveCart) => cart),
});

const makeMockLogger = (): LoggerPort => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
});

describe("MergeCartUseCase", () => {
	let repository: ActiveCartRepository;
	let logger: LoggerPort;
	let useCase: MergeCartUseCase;

	beforeEach(() => {
		repository = makeMockRepository();
		logger = makeMockLogger();
		useCase = new MergeCartUseCase(repository, logger);
	});

	it("should call findByUserId with the correct userId", async () => {
		const input = makeValidInput({ userId: "user-abc" });

		await useCase.execute(input);

		expect(repository.findByUserId).toHaveBeenCalledOnce();
		expect(repository.findByUserId).toHaveBeenCalledWith("user-abc");
	});

	it("should call upsert with merged cart after merge", async () => {
		const input = makeValidInput();

		await useCase.execute(input);

		expect(repository.upsert).toHaveBeenCalledOnce();
		const upsertedCart = vi.mocked(repository.upsert).mock.calls[0][0];
		expect(upsertedCart.userId).toBe("user-123");
		expect(upsertedCart.items).toHaveLength(1);
		expect(upsertedCart.items[0].productName).toBe("Leche Entera");
	});

	it("should generate a new UUID for cartId when no existing cart is found", async () => {
		vi.mocked(repository.findByUserId).mockResolvedValue(null);
		const input = makeValidInput();

		await useCase.execute(input);

		const upsertedCart = vi.mocked(repository.upsert).mock.calls[0][0];
		expect(upsertedCart.id).toBeDefined();
		expect(typeof upsertedCart.id).toBe("string");
		expect(upsertedCart.id.length).toBeGreaterThan(0);
	});

	it("should reuse the existing cartId when an existing cart is found", async () => {
		const existingCart = makeActiveCart({ id: "existing-cart-id" });
		vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);
		const input = makeValidInput();

		await useCase.execute(input);

		const upsertedCart = vi.mocked(repository.upsert).mock.calls[0][0];
		expect(upsertedCart.id).toBe("existing-cart-id");
	});

	it("should merge incoming items with existing items using client-wins semantics", async () => {
		const existingCart = makeActiveCart({
			id: "cart-id",
			items: [
				{
					productId: "prod-uuid-1",
					productName: "Leche Entera",
					supermarket: "mercadona",
					category: "dairy",
					price: 1.05,
					pricePerUnit: 1.05,
					unit: "l",
					taxType: "IGIC",
					quantity: 5,
				},
				{
					productId: "prod-uuid-2",
					productName: "Pan Integral",
					supermarket: "lidl",
					category: "bakery",
					price: 1.2,
					pricePerUnit: 1.2,
					unit: "kg",
					taxType: "IGIC",
					quantity: 1,
				},
			],
		});
		vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);

		const input = makeValidInput({
			items: [
				{
					productId: "prod-uuid-1",
					productName: "Leche Entera",
					supermarket: "mercadona",
					category: "dairy",
					price: 1.05,
					pricePerUnit: 1.05,
					unit: "l",
					taxType: "IGIC",
					quantity: 2,
				},
			],
		});

		await useCase.execute(input);

		const upsertedCart = vi.mocked(repository.upsert).mock.calls[0][0];
		expect(upsertedCart.items).toHaveLength(2);
		const lecheItem = upsertedCart.items.find(
			(item) => item.productName === "Leche Entera",
		);
		expect(lecheItem?.quantity).toBe(2);
		const panItem = upsertedCart.items.find(
			(item) => item.productName === "Pan Integral",
		);
		expect(panItem?.quantity).toBe(1);
	});

	it("should return result with correct cartId, userId and itemCount", async () => {
		vi.mocked(repository.upsert).mockResolvedValue(
			makeActiveCart({
				id: "returned-cart-id",
				userId: "user-123",
				items: [
					{
						productId: "prod-uuid-1",
						productName: "Leche Entera",
						supermarket: "mercadona",
						category: "dairy",
						price: 1.05,
						pricePerUnit: 1.05,
						unit: "l",
						taxType: "IGIC",
						quantity: 2,
					},
				],
			}),
		);

		const result = await useCase.execute(makeValidInput());

		expect(result.cartId).toBe("returned-cart-id");
		expect(result.userId).toBe("user-123");
		expect(result.totalItems).toBe(1);
		expect(result.items).toHaveLength(1);
	});

	it("should handle empty incoming items and keep existing items intact", async () => {
		const existingCart = makeActiveCart({
			items: [
				{
					productId: "prod-uuid-1",
					productName: "Leche Entera",
					supermarket: "mercadona",
					category: "dairy",
					price: 1.05,
					pricePerUnit: 1.05,
					unit: "l",
					taxType: "IGIC",
					quantity: 3,
				},
			],
		});
		vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);

		const input = makeValidInput({ items: [] });

		await useCase.execute(input);

		const upsertedCart = vi.mocked(repository.upsert).mock.calls[0][0];
		expect(upsertedCart.items).toHaveLength(1);
		expect(upsertedCart.items[0].quantity).toBe(3);
	});
});
