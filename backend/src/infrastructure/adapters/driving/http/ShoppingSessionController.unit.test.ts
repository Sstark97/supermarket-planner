import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShoppingSessionController } from "./ShoppingSessionController";
import type { SaveShoppingSessionUseCasePort } from "@application/ports/incoming/SaveShoppingSessionUseCasePort";
import type { GetShoppingSessionsUseCasePort } from "@application/ports/incoming/GetShoppingSessionsUseCasePort";
import type { Request, Response, NextFunction } from "express";
import type {
	GetShoppingSessionsResult,
	SaveShoppingSessionResult,
} from "@application/use-cases/shopping-session/contracts";

const validItem = {
	productName: "Leche Entera",
	supermarket: "mercadona",
	category: "dairy",
	price: 1.05,
	pricePerUnit: 1.05,
	unit: "l",
	taxType: "IGIC",
	quantity: 2,
};

const validBody = {
	shoppedAt: "2026-05-31",
	items: [validItem],
};

const mockSaveUseCaseResult: SaveShoppingSessionResult = {
	sessionId: "session-uuid-123",
	totalPrice: 2.1,
	itemCount: 1,
};

const mockGetUseCaseResult: GetShoppingSessionsResult = {
	sessions: [
		{
			sessionId: "session-uuid-123",
			shoppedAt: "2026-05-31T00:00:00.000Z",
			totalPrice: 2.1,
			createdAt: "2026-05-31T18:00:00.000Z",
			items: [
				{
					productName: "Leche Entera",
					supermarket: "mercadona",
					category: "dairy",
					price: 1.05,
					pricePerUnit: 1.05,
					unit: "l",
					taxType: "IGIC",
					quantity: 2,
				},
			],
		},
	],
};

function makeMockSaveUseCase(): SaveShoppingSessionUseCasePort {
	return {
		execute: vi.fn(async () => mockSaveUseCaseResult),
	};
}

function makeMockGetUseCase(): GetShoppingSessionsUseCasePort {
	return {
		execute: vi.fn(async () => mockGetUseCaseResult),
	};
}

function makeMockResponse(userId = "user-google-123"): Response {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		locals: { userId },
	} as unknown as Response;
}

function makeMockRequest(body: unknown): Request {
	return { body } as unknown as Request;
}

describe("ShoppingSessionController", () => {
	let saveUseCase: SaveShoppingSessionUseCasePort;
	let getUseCase: GetShoppingSessionsUseCasePort;
	let controller: ShoppingSessionController;
	let next: NextFunction;

	beforeEach(() => {
		saveUseCase = makeMockSaveUseCase();
		getUseCase = makeMockGetUseCase();
		controller = new ShoppingSessionController(saveUseCase, getUseCase);
		next = vi.fn();
	});

	it("should return 200 with shopping sessions", async () => {
		const req = makeMockRequest({});
		const res = makeMockResponse();

		await controller.get(req, res, next);

		expect(getUseCase.execute).toHaveBeenCalledWith({
			userId: "user-google-123",
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockGetUseCaseResult);
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 401 for get when user is unauthorized", async () => {
		const req = makeMockRequest({});
		const res = makeMockResponse("");

		await controller.get(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
	});

	it("should return 201 with the session result on valid input", async () => {
		const req = makeMockRequest(validBody);
		const res = makeMockResponse();

		await controller.save(req, res, next);

		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(mockSaveUseCaseResult);
		expect(next).not.toHaveBeenCalled();
	});

	it("should pass userId from res.locals to save use case", async () => {
		const req = makeMockRequest(validBody);
		const res = makeMockResponse("user-specific-id-789");

		await controller.save(req, res, next);

		expect(saveUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-specific-id-789" }),
		);
	});

	it("should return 400 when items array is missing", async () => {
		const req = makeMockRequest({ shoppedAt: "2026-05-31" });
		const res = makeMockResponse();

		await controller.save(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: "Invalid request body" }),
		);
	});

	it("should return 400 when items array is empty", async () => {
		const req = makeMockRequest({ shoppedAt: "2026-05-31", items: [] });
		const res = makeMockResponse();

		await controller.save(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: "Invalid request body" }),
		);
	});

	it("should return 400 when shoppedAt is missing", async () => {
		const req = makeMockRequest({ items: [validItem] });
		const res = makeMockResponse();

		await controller.save(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it("should return 400 when an item is missing a required field", async () => {
		const incompleteItem = { productName: "Pan", supermarket: "lidl" };
		const req = makeMockRequest({
			shoppedAt: "2026-05-31",
			items: [incompleteItem],
		});
		const res = makeMockResponse();

		await controller.save(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it("should delegate errors from save use case to next()", async () => {
		const useCaseError = new Error("Unexpected repository failure");
		vi.mocked(saveUseCase.execute).mockRejectedValueOnce(useCaseError);

		const req = makeMockRequest(validBody);
		const res = makeMockResponse();

		await controller.save(req, res, next);

		expect(next).toHaveBeenCalledWith(useCaseError);
	});

	it("should delegate errors from get use case to next()", async () => {
		const useCaseError = new Error("Unexpected get failure");
		vi.mocked(getUseCase.execute).mockRejectedValueOnce(useCaseError);

		const req = makeMockRequest({});
		const res = makeMockResponse();

		await controller.get(req, res, next);

		expect(next).toHaveBeenCalledWith(useCaseError);
	});
});
