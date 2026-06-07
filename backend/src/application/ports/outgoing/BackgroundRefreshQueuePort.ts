export interface BackgroundRefreshQueuePort {
	enqueue(query: string, postalCode: string): boolean;
}
