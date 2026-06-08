export type ZoneOnboardingQueueState =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED";

export interface ZoneOnboardingQueueItem {
	id: string;
	postalCode: string;
	requestedDay: Date;
	state: ZoneOnboardingQueueState;
	attempts: number;
	requestedByUserId?: string;
	errorMessage?: string;
	processedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface PublishZoneOnboardingRequestInput {
	postalCode: string;
	requestedByUserId?: string;
	requestedAt?: Date;
}

export interface QueuePort {
	publishZoneOnboardingRequest(
		input: PublishZoneOnboardingRequestInput,
	): Promise<ZoneOnboardingQueueItem>;
	fetchPendingItems(limit: number): Promise<ZoneOnboardingQueueItem[]>;
	isPricingZoneEmpty(postalCode: string): Promise<boolean>;
	markItemAsProcessing(queueItemId: string): Promise<void>;
	markItemAsProcessed(queueItemId: string): Promise<void>;
	markItemAsFailed(queueItemId: string, errorMessage: string): Promise<void>;
}
