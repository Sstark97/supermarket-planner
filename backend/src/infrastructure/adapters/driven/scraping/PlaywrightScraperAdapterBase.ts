import type {
	CircuitBreakerStatus,
	SupermarketSearchPort,
} from "../../../../application/ports/outgoing/SupermarketSearchPort";
import type { IProduct } from "../../../../interfaces/IProduct";
import { logger } from "../../../../utils/logger";

/**
 * Abstract base class for all supermarket scrapers.
 * Implements the Template Method pattern:
 *   - `search()` is the public entry point with error handling, circuit breaker, and logging.
 *   - `scrape()` is the abstract method that each subclass must implement.
 *
 * Following OCP: new scrapers extend this class without modifying it.
 */
export abstract class PlaywrightScraperAdapterBase
	implements SupermarketSearchPort
{
	abstract readonly name: string;

	private failureCount = 0;
	private circuitOpen = false;
	private readonly threshold: number;

	constructor(circuitBreakerThreshold = 5) {
		this.threshold = circuitBreakerThreshold;
	}

	/**
	 * Public entry point. Handles circuit breaker and graceful error degradation.
	 */
	async search(query: string): Promise<IProduct[]> {
		if (this.circuitOpen) {
			logger.warn(`[${this.name}] Circuit is OPEN — skipping scrape.`);
			return [];
		}

		const start = Date.now();
		try {
			logger.info(`[${this.name}] Starting scrape for: "${query}"`);
			const results = await this.scrape(query);
			this.failureCount = 0; // reset on success
			logger.info(
				`[${this.name}] Done. ${results.length} results in ${Date.now() - start}ms`,
			);
			return results;
		} catch (error) {
			this.failureCount++;
			logger.error(
				`[${this.name}] Scrape failed (${this.failureCount}/${this.threshold}): ${String(error)}`,
			);

			if (this.failureCount >= this.threshold) {
				this.circuitOpen = true;
				logger.error(
					`[${this.name}] Circuit OPENED after ${this.threshold} consecutive failures.`,
				);
			}

			throw error;
		}
	}

	/**
	 * Resets the circuit breaker (e.g., after a fix deployment).
	 */
	resetCircuit(): void {
		this.failureCount = 0;
		this.circuitOpen = false;
		logger.info(`[${this.name}] Circuit reset.`);
	}

	get isCircuitOpen(): boolean {
		return this.circuitOpen;
	}

	getCircuitBreakerStatus(): CircuitBreakerStatus {
		return {
			state: this.circuitOpen ? "open" : "closed",
			isOpen: this.circuitOpen,
			failureCount: this.failureCount,
			threshold: this.threshold,
		};
	}

	/**
	 * Core scraping logic — subclasses implement this.
	 */
	protected abstract scrape(query: string): Promise<IProduct[]>;
}
