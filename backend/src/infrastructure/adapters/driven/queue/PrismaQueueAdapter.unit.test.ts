import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaQueueAdapter } from "./PrismaQueueAdapter";

const prismaMock = vi.hoisted(() => ({
	zoneOnboardingQueue: {
		upsert: vi.fn(),
		findMany: vi.fn(),
		update: vi.fn(),
	},
	postalCode: {
		findUnique: vi.fn(),
	},
	productPrice: {
		count: vi.fn(),
	},
}));

vi.mock("../persistence/prisma/prisma", () => ({
	prisma: prismaMock,
}));

describe("PrismaQueueAdapter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should publish queue requests with idempotent upsert by postalCode and requestedDay", async () => {
		const adapter = new PrismaQueueAdapter();
		const requestedAt = new Date("2026-06-07T15:45:00.000Z");
		prismaMock.zoneOnboardingQueue.upsert.mockResolvedValue({
			id: "queue-item-1",
			postalCode: "35001",
			requestedDay: new Date("2026-06-07T00:00:00.000Z"),
			state: "PENDING",
			attempts: 0,
			requestedByUserId: "user-1",
			errorMessage: null,
			processedAt: null,
			createdAt: new Date("2026-06-07T15:45:00.000Z"),
			updatedAt: new Date("2026-06-07T15:45:00.000Z"),
		});

		await adapter.publishZoneOnboardingRequest({
			postalCode: "35001",
			requestedByUserId: "user-1",
			requestedAt,
		});

		expect(prismaMock.zoneOnboardingQueue.upsert).toHaveBeenCalledWith({
			where: {
				postalCode_requestedDay: {
					postalCode: "35001",
					requestedDay: new Date("2026-06-07T00:00:00.000Z"),
				},
			},
			update: {},
			create: {
				postalCode: "35001",
				requestedDay: new Date("2026-06-07T00:00:00.000Z"),
				requestedByUserId: "user-1",
			},
		});
	});

	it("should fetch pending items ordered by oldest creation date", async () => {
		const adapter = new PrismaQueueAdapter();
		prismaMock.zoneOnboardingQueue.findMany.mockResolvedValue([]);

		await adapter.fetchPendingItems(25);

		expect(prismaMock.zoneOnboardingQueue.findMany).toHaveBeenCalledWith({
			where: { state: "PENDING" },
			orderBy: { createdAt: "asc" },
			take: 25,
		});
	});

	it("should report a zone as empty when postal code is not mapped", async () => {
		const adapter = new PrismaQueueAdapter();
		prismaMock.postalCode.findUnique.mockResolvedValue(null);

		const isEmpty = await adapter.isPricingZoneEmpty("35010");

		expect(prismaMock.postalCode.findUnique).toHaveBeenCalledWith({
			where: { code: "35010" },
			select: { zoneId: true },
		});
		expect(isEmpty).toBe(true);
	});

	it("should report a zone as non-empty when mapped zone has prices", async () => {
		const adapter = new PrismaQueueAdapter();
		prismaMock.postalCode.findUnique.mockResolvedValue({
			zoneId: "las-palmas-gc",
		});
		prismaMock.productPrice.count.mockResolvedValue(12);

		const isEmpty = await adapter.isPricingZoneEmpty("35010");

		expect(prismaMock.productPrice.count).toHaveBeenCalledWith({
			where: { zoneId: "las-palmas-gc" },
		});
		expect(isEmpty).toBe(false);
	});

	it("should mark queue item as processing and increment attempts", async () => {
		const adapter = new PrismaQueueAdapter();

		await adapter.markItemAsProcessing("queue-item-1");

		expect(prismaMock.zoneOnboardingQueue.update).toHaveBeenCalledWith({
			where: { id: "queue-item-1" },
			data: {
				state: "PROCESSING",
				attempts: { increment: 1 },
				errorMessage: null,
			},
		});
	});

	it("should mark queue item as processed with completion timestamp", async () => {
		const adapter = new PrismaQueueAdapter();

		await adapter.markItemAsProcessed("queue-item-1");

		expect(prismaMock.zoneOnboardingQueue.update).toHaveBeenCalledWith({
			where: { id: "queue-item-1" },
			data: {
				state: "COMPLETED",
				processedAt: expect.any(Date),
				errorMessage: null,
			},
		});
	});

	it("should mark queue item as failed with error message", async () => {
		const adapter = new PrismaQueueAdapter();

		await adapter.markItemAsFailed("queue-item-1", "timeout");

		expect(prismaMock.zoneOnboardingQueue.update).toHaveBeenCalledWith({
			where: { id: "queue-item-1" },
			data: {
				state: "FAILED",
				processedAt: expect.any(Date),
				errorMessage: "timeout",
			},
		});
	});
});
