import { EventEmitter } from "node:events";
import type { BackgroundRefreshQueuePort } from "../../../../application/ports/outgoing/BackgroundRefreshQueuePort";
import { logger } from "../../../logging/logger";

type RefreshHandler = (query: string) => Promise<void>;

export class InMemoryBackgroundRefreshQueueAdapter
	implements BackgroundRefreshQueuePort
{
	private readonly eventBus = new EventEmitter();
	private readonly queue: string[] = [];
	private readonly queued = new Set<string>();
	private readonly running = new Set<string>();
	private processing = false;

	constructor(private readonly handler: RefreshHandler) {
		this.eventBus.on("refresh-enqueued", () => {
			void this.process();
		});
	}

	enqueue(rawQuery: string): boolean {
		const query = rawQuery.trim().toLowerCase();
		if (!query) return false;

		if (this.queued.has(query) || this.running.has(query)) {
			logger.info(
				`[InMemoryBackgroundRefreshQueueAdapter] Query already queued/running: "${query}"`,
			);
			return false;
		}

		this.queue.push(query);
		this.queued.add(query);
		logger.info(
			`[InMemoryBackgroundRefreshQueueAdapter] Enqueued query: "${query}"`,
		);
		this.eventBus.emit("refresh-enqueued");
		return true;
	}

	private async process(): Promise<void> {
		if (this.processing) return;
		this.processing = true;

		while (this.queue.length > 0) {
			const query = this.queue.shift();
			if (!query) continue;

			this.queued.delete(query);
			this.running.add(query);

			try {
				await this.handler(query);
			} catch (error) {
				logger.error(
					`[InMemoryBackgroundRefreshQueueAdapter] Background refresh failed for "${query}": ${String(error)}`,
				);
			} finally {
				this.running.delete(query);
			}
		}

		this.processing = false;
	}
}
