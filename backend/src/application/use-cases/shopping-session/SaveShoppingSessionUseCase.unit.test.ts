import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveShoppingSessionUseCase } from "./SaveShoppingSessionUseCase";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";
import type { SaveShoppingSessionInput } from "./contracts";

const makeValidInput = (
	overrides: Partial<SaveShoppingSessionInput> = {},
): SaveShoppingSessionInput => ({
	userId: "user-google-123",
	shoppedAt: "2026-05-31",
	items: [
		{
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

const makeMockRepository = (): ShoppingSessionRepository => ({
	save: vi.fn(async (session: ShoppingSession) => session),
	findByUserId: vi.fn(async () => []),
	deleteByIdForUser: vi.fn(async () => false),
});

const makeMockLogger = (): LoggerPort => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
});

describe("SaveShoppingSessionUseCase", () => {
	let repository: ShoppingSessionRepository;
	let logger: LoggerPort;
	let useCase: SaveShoppingSessionUseCase;

	beforeEach(() => {
		repository = makeMockRepository();
		logger = makeMockLogger();
		useCase = new SaveShoppingSessionUseCase(repository, logger);
	});

	it("should save a session and return the correct result for valid input", async () => {
		const input = makeValidInput();

		const result = await useCase.execute(input);

		expect(result.sessionId).toBeDefined();
		expect(result.totalPrice).toBe(2.1);
		expect(result.itemCount).toBe(1);
	});

	it("should generate a unique UUID for each session", async () => {
		const first = await useCase.execute(makeValidInput());
		const second = await useCase.execute(makeValidInput());

		expect(first.sessionId).not.toBe(second.sessionId);
	});

	it("should pass userId from input through to the saved session entity", async () => {
		const input = makeValidInput({ userId: "user-abc-456" });

		await useCase.execute(input);

		const savedSession = vi.mocked(repository.save).mock.calls[0][0];
		expect(savedSession.userId).toBe("user-abc-456");
	});

	it("should correctly calculate total price via the domain calculator", async () => {
		const input = makeValidInput({
			items: [
				{
					productName: "Pan",
					supermarket: "lidl",
					category: "bakery",
					price: 1.33,
					pricePerUnit: 1.33,
					unit: "kg",
					taxType: "IGIC",
					quantity: 3,
				},
			],
		});

		const result = await useCase.execute(input);

		expect(result.totalPrice).toBe(3.99);
	});

	it("should delegate to the repository with the full session object", async () => {
		const input = makeValidInput();

		await useCase.execute(input);

		expect(repository.save).toHaveBeenCalledOnce();
		const savedSession = vi.mocked(repository.save).mock.calls[0][0];
		expect(savedSession.items).toHaveLength(1);
		expect(savedSession.items[0].productName).toBe("Leche Entera");
	});

	it("should reject an empty items array with a descriptive error", async () => {
		const input = makeValidInput({ items: [] });

		await expect(useCase.execute(input)).rejects.toThrow(
			"Cannot save a shopping session with no items.",
		);
	});

	it("should reject an invalid shoppedAt date string", async () => {
		const input = makeValidInput({ shoppedAt: "not-a-date" });

		await expect(useCase.execute(input)).rejects.toThrow(
			'Invalid shoppedAt date: "not-a-date"',
		);
	});

	it("should parse shoppedAt ISO string into a Date on the saved session", async () => {
		const input = makeValidInput({ shoppedAt: "2026-05-31" });

		await useCase.execute(input);

		const savedSession = vi.mocked(repository.save).mock.calls[0][0];
		expect(savedSession.shoppedAt).toBeInstanceOf(Date);
		expect(savedSession.shoppedAt.toISOString()).toContain("2026-05-31");
	});
});
