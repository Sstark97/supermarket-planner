import { describe, expect, it, vi } from "vitest";
import { InMemoryBackgroundRefreshQueueAdapter } from "./BackgroundRefreshQueue";

describe("InMemoryBackgroundRefreshQueueAdapter.enqueue", () => {
	it("accepts the same query for different postal codes as independent refreshes", async () => {
		const handler = vi.fn().mockResolvedValue(undefined);
		const queue = new InMemoryBackgroundRefreshQueueAdapter(handler);

		const acceptedForFirstPostalCode = queue.enqueue("leche", "35001");
		const acceptedForSecondPostalCode = queue.enqueue("leche", "28001");

		expect(acceptedForFirstPostalCode).toBe(true);
		expect(acceptedForSecondPostalCode).toBe(true);
	});

	it("rejects an already queued query for the same postal code", () => {
		const handler = vi.fn().mockResolvedValue(undefined);
		const queue = new InMemoryBackgroundRefreshQueueAdapter(handler);

		queue.enqueue("leche", "35001");
		const rejectedDuplicate = queue.enqueue("leche", "35001");

		expect(rejectedDuplicate).toBe(false);
	});

	it("rejects a blank query", () => {
		const handler = vi.fn().mockResolvedValue(undefined);
		const queue = new InMemoryBackgroundRefreshQueueAdapter(handler);

		expect(queue.enqueue("   ", "35001")).toBe(false);
	});

	it("forwards the normalized query and postal code to the refresh handler", async () => {
		const handler = vi.fn().mockResolvedValue(undefined);
		const queue = new InMemoryBackgroundRefreshQueueAdapter(handler);

		queue.enqueue("  LECHE  ", "35001");

		await vi.waitFor(() => {
			expect(handler).toHaveBeenCalledWith("leche", "35001");
		});
	});
});
