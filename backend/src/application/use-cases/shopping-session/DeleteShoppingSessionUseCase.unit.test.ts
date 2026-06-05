import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteShoppingSessionUseCase } from "./DeleteShoppingSessionUseCase";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";

function makeMockRepository(): ShoppingSessionRepository {
	return {
		save: vi.fn(async (session: ShoppingSession) => session),
		findByUserId: vi.fn(async () => []),
		deleteByIdForUser: vi.fn(async () => true),
		getMetricsForUser: vi.fn(async () => ({
			supermarketDominance: [],
			spendingTrends: {
				weeklyAverage: [],
				monthlyTotal: [],
				yearlyTotal: [],
			},
			ticketMetrics: {
				averageTicketCost: 0,
				totalSpentToDate: 0,
				mostFrequentGroceryDay: null,
				totalTickets: 0,
			},
		})),
	};
}

function makeMockLogger(): LoggerPort {
	return {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};
}

describe("DeleteShoppingSessionUseCase", () => {
	let repository: ShoppingSessionRepository;
	let logger: LoggerPort;
	let useCase: DeleteShoppingSessionUseCase;

	beforeEach(() => {
		repository = makeMockRepository();
		logger = makeMockLogger();
		useCase = new DeleteShoppingSessionUseCase(repository, logger);
	});

	it("should delete session when ownership matches", async () => {
		const result = await useCase.execute({
			sessionId: "session-1",
			userId: "user-1",
		});

		expect(repository.deleteByIdForUser).toHaveBeenCalledWith(
			"session-1",
			"user-1",
		);
		expect(result.deleted).toBe(true);
	});

	it("should return not deleted when no owned row exists", async () => {
		vi.mocked(repository.deleteByIdForUser).mockResolvedValueOnce(false);

		const result = await useCase.execute({
			sessionId: "session-1",
			userId: "user-1",
		});

		expect(result.deleted).toBe(false);
	});

	it("should reject empty sessionId", async () => {
		await expect(
			useCase.execute({ sessionId: "  ", userId: "user-1" }),
		).rejects.toThrow("sessionId is required.");
	});

	it("should reject empty userId", async () => {
		await expect(
			useCase.execute({ sessionId: "session-1", userId: "" }),
		).rejects.toThrow("userId is required.");
	});
});
