import { EventEmitter } from "node:events";
import type { BackgroundRefreshQueuePort } from "@application/ports/outgoing/BackgroundRefreshQueuePort";
import { logger } from "@infrastructure/logging/logger";

interface RefreshQueueEntry {
	query: string;
	postalCode: string;
}

type RefreshHandler = (query: string, postalCode: string) => Promise<void>;

export class InMemoryBackgroundRefreshQueueAdapter
	implements BackgroundRefreshQueuePort
{
	private readonly eventBus = new EventEmitter();
	private readonly queue: RefreshQueueEntry[] = [];
	private readonly queued = new Set<string>();
	private readonly running = new Set<string>();
	private processing = false;

	constructor(private readonly handler: RefreshHandler) {
		this.eventBus.on("refresh-enqueued", () => {
			void this.process();
		});
	}

	enqueue(rawQuery: string, postalCode: string): boolean {
		const query = rawQuery.trim().toLowerCase();
		if (!query) return false;

		const deduplicationKey = this.buildDeduplicationKey(query, postalCode);
		if (this.queued.has(deduplicationKey) || this.running.has(deduplicationKey)) {
			logger.info(
				`[InMemoryBackgroundRefreshQueueAdapter] Query already queued/running: "${deduplicationKey}"`,
			);
			return false;
		}

		this.queue.push({ query, postalCode });
		this.queued.add(deduplicationKey);
		logger.info(
			`[InMemoryBackgroundRefreshQueueAdapter] Enqueued query: "${deduplicationKey}"`,
		);
		this.eventBus.emit("refresh-enqueued");
		return true;
	}

	private buildDeduplicationKey(query: string, postalCode: string): string {
		return `${query}:${postalCode}`;
	}

	private async process(): Promise<void> {
		if (this.processing) return;
		this.processing = true;

		while (this.queue.length > 0) {
			const entry = this.queue.shift();
			if (!entry) continue;

			const deduplicationKey = this.buildDeduplicationKey(
				entry.query,
				entry.postalCode,
			);
			this.queued.delete(deduplicationKey);
			this.running.add(deduplicationKey);

			try {
				await this.handler(entry.query, entry.postalCode);
			} catch (error) {
				logger.error(
					`[InMemoryBackgroundRefreshQueueAdapter] Background refresh failed for "${deduplicationKey}": ${String(error)}`,
				);
			} finally {
				this.running.delete(deduplicationKey);
			}
		}

		this.processing = false;
	}
}
