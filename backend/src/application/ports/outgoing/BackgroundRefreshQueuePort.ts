export interface BackgroundRefreshQueuePort {
	enqueue(query: string): boolean;
}
