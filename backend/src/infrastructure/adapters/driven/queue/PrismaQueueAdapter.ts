import type {
	PublishZoneOnboardingRequestInput,
	QueuePort,
	ZoneOnboardingQueueItem,
} from "@domain/ports/QueuePort";
import type { ZoneOnboardingQueue } from "@prisma/client";
import { prisma } from "../persistence/prisma/prisma";

export class PrismaQueueAdapter implements QueuePort {
	async publishZoneOnboardingRequest(
		input: PublishZoneOnboardingRequestInput,
	): Promise<ZoneOnboardingQueueItem> {
		const requestedDay = this.normalizeToRequestedDay(input.requestedAt);
		const savedRow = await prisma.zoneOnboardingQueue.upsert({
			where: {
				postalCode_requestedDay: {
					postalCode: input.postalCode,
					requestedDay,
				},
			},
			update: {},
			create: {
				postalCode: input.postalCode,
				requestedDay,
				requestedByUserId: input.requestedByUserId,
			},
		});

		return this.mapRowToQueueItem(savedRow);
	}

	async fetchPendingItems(limit: number): Promise<ZoneOnboardingQueueItem[]> {
		const pendingRows = await prisma.zoneOnboardingQueue.findMany({
			where: { state: "PENDING" },
			orderBy: { createdAt: "asc" },
			take: limit,
		});

		return pendingRows.map((row) => this.mapRowToQueueItem(row));
	}

	async isPricingZoneEmpty(postalCode: string): Promise<boolean> {
		const postalCodeMapping = await prisma.postalCode.findUnique({
			where: { code: postalCode },
			select: { zoneId: true },
		});
		if (!postalCodeMapping) {
			return true;
		}

		const pricesCount = await prisma.productPrice.count({
			where: { zoneId: postalCodeMapping.zoneId },
		});

		return pricesCount === 0;
	}

	async markItemAsProcessing(queueItemId: string): Promise<void> {
		await prisma.zoneOnboardingQueue.update({
			where: { id: queueItemId },
			data: {
				state: "PROCESSING",
				attempts: { increment: 1 },
				errorMessage: null,
			},
		});
	}

	async markItemAsProcessed(queueItemId: string): Promise<void> {
		await prisma.zoneOnboardingQueue.update({
			where: { id: queueItemId },
			data: {
				state: "COMPLETED",
				processedAt: new Date(),
				errorMessage: null,
			},
		});
	}

	async markItemAsFailed(
		queueItemId: string,
		errorMessage: string,
	): Promise<void> {
		await prisma.zoneOnboardingQueue.update({
			where: { id: queueItemId },
			data: {
				state: "FAILED",
				processedAt: new Date(),
				errorMessage,
			},
		});
	}

	private normalizeToRequestedDay(requestedAt?: Date): Date {
		const date = requestedAt ?? new Date();
		return new Date(
			Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
		);
	}

	private mapRowToQueueItem(row: ZoneOnboardingQueue): ZoneOnboardingQueueItem {
		return {
			id: row.id,
			postalCode: row.postalCode,
			requestedDay: row.requestedDay,
			state: row.state,
			attempts: row.attempts,
			requestedByUserId: row.requestedByUserId ?? undefined,
			errorMessage: row.errorMessage ?? undefined,
			processedAt: row.processedAt ?? undefined,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
