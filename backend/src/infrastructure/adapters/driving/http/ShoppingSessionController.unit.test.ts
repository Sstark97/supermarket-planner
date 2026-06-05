import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShoppingSessionController } from "./ShoppingSessionController";
import type { SaveShoppingSessionUseCasePort } from "@application/ports/incoming/SaveShoppingSessionUseCasePort";
import type { GetShoppingSessionsUseCasePort } from "@application/ports/incoming/GetShoppingSessionsUseCasePort";
import type { DeleteShoppingSessionUseCasePort } from "@application/ports/incoming/DeleteShoppingSessionUseCasePort";
import type { Request, Response, NextFunction } from "express";
import type {
	DeleteShoppingSessionResult,
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

const mockDeleteUseCaseResult: DeleteShoppingSessionResult = {
	deleted: true,
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

function makeMockDeleteUseCase(): DeleteShoppingSessionUseCasePort {
	return {
		execute: vi.fn(async () => mockDeleteUseCaseResult),
	};
}

function makeMockResponse(userId = "user-google-123"): Response {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		locals: { userId },
	} as unknown as Response;
}

function makeMockRequest(body: unknown, params: Record<string, string> = {}): Request {
	return { body, params } as unknown as Request;
}

describe("ShoppingSessionController", () => {
	let saveUseCase: SaveShoppingSessionUseCasePort;
	let getUseCase: GetShoppingSessionsUseCasePort;
	let deleteUseCase: DeleteShoppingSessionUseCasePort;
	let controller: ShoppingSessionController;
	let next: NextFunction;

	beforeEach(() => {
		saveUseCase = makeMockSaveUseCase();
		getUseCase = makeMockGetUseCase();
		deleteUseCase = makeMockDeleteUseCase();
		controller = new ShoppingSessionController(
			saveUseCase,
			getUseCase,
			deleteUseCase,
		);
		next = vi.fn();
	});

	it("should return 200 with shopping sessions", async () => {
		const req = makeMockRequest({});
		const res = makeMockResponse();

		await controller.get(req, res, next);

		expect(getUseCase.execute).toHaveBeenCalledWith({ userId: "user-google-123" });
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

	it("should delegate errors from get use case to next()", async () => {
		const useCaseError = new Error("Unexpected get failure");
		vi.mocked(getUseCase.execute).mockRejectedValueOnce(useCaseError);

		const req = makeMockRequest({});
		const res = makeMockResponse();

		await controller.get(req, res, next);

		expect(next).toHaveBeenCalledWith(useCaseError);
	});

	it("should return 200 when delete succeeds", async () => {
		const req = makeMockRequest({}, { id: "session-1" });
		const res = makeMockResponse();

		await controller.delete(req, res, next);

		expect(deleteUseCase.execute).toHaveBeenCalledWith({
			sessionId: "session-1",
			userId: "user-google-123",
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ deleted: true });
	});

	it("should return 400 for delete when id is missing", async () => {
		const req = makeMockRequest({}, {});
		const res = makeMockResponse();

		await controller.delete(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid shopping session id" });
	});

	it("should return 401 for delete when unauthorized", async () => {
		const req = makeMockRequest({}, { id: "session-1" });
		const res = makeMockResponse("");

		await controller.delete(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
	});

	it("should return 404 for delete when session is not found", async () => {
		vi.mocked(deleteUseCase.execute).mockResolvedValueOnce({ deleted: false });
		const req = makeMockRequest({}, { id: "session-1" });
		const res = makeMockResponse();

		await controller.delete(req, res, next);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: "Shopping session not found" });
	});

	it("should delegate errors from delete use case to next()", async () => {
		const useCaseError = new Error("Unexpected delete failure");
		vi.mocked(deleteUseCase.execute).mockRejectedValueOnce(useCaseError);

		const req = makeMockRequest({}, { id: "session-1" });
		const res = makeMockResponse();

		await controller.delete(req, res, next);

		expect(next).toHaveBeenCalledWith(useCaseError);
	});
});
