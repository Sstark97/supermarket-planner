import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import type { SaveShoppingSessionUseCasePort } from "@application/ports/incoming/SaveShoppingSessionUseCasePort";
import type { GetShoppingSessionsUseCasePort } from "@application/ports/incoming/GetShoppingSessionsUseCasePort";
import type { DeleteShoppingSessionUseCasePort } from "@application/ports/incoming/DeleteShoppingSessionUseCasePort";
import type { GetShoppingSessionMetricsUseCasePort } from "@application/ports/incoming/GetShoppingSessionMetricsUseCasePort";

const shoppingSessionItemSchema = z.object({
	productName: z.string().min(1),
	supermarket: z.string().min(1),
	category: z.string().min(1),
	price: z.number(),
	pricePerUnit: z.number(),
	unit: z.string().min(1),
	taxType: z.string().min(1),
	quantity: z.number().int().positive(),
	image: z.string().optional(),
	url: z.string().optional(),
});

const saveShoppingSessionBodySchema = z.object({
	shoppedAt: z.string().min(1),
	items: z.array(shoppingSessionItemSchema).min(1, {
		message: "Shopping session must contain at least one item.",
	}),
});

const shoppingSessionIdParamsSchema = z.object({
	id: z.string().min(1),
});

export class ShoppingSessionController {
	constructor(
		private readonly saveShoppingSessionUseCase: SaveShoppingSessionUseCasePort,
		private readonly getShoppingSessionsUseCase: GetShoppingSessionsUseCasePort,
		private readonly getShoppingSessionMetricsUseCase: GetShoppingSessionMetricsUseCasePort,
		private readonly deleteShoppingSessionUseCase: DeleteShoppingSessionUseCasePort,
	) {}

	getMetrics = async (
		_request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId: unknown = response.locals.userId;
			if (!this.isValidUserId(userId)) {
				response.status(401).json({ error: "Unauthorized" });
				return;
			}

			const result = await this.getShoppingSessionMetricsUseCase.execute({
				userId,
			});
			response.status(200).json(result);
		} catch (error) {
			next(error);
		}
	};

	get = async (
		_request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId: unknown = response.locals.userId;
			if (!this.isValidUserId(userId)) {
				response.status(401).json({ error: "Unauthorized" });
				return;
			}

			const result = await this.getShoppingSessionsUseCase.execute({ userId });
			response.status(200).json(result);
		} catch (error) {
			next(error);
		}
	};

	delete = async (
		request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		const parsedParams = shoppingSessionIdParamsSchema.safeParse(request.params);
		if (!parsedParams.success) {
			response.status(400).json({ error: "Invalid shopping session id" });
			return;
		}

		try {
			const userId: unknown = response.locals.userId;
			if (!this.isValidUserId(userId)) {
				response.status(401).json({ error: "Unauthorized" });
				return;
			}

			const result = await this.deleteShoppingSessionUseCase.execute({
				sessionId: parsedParams.data.id,
				userId,
			});

			if (!result.deleted) {
				response.status(404).json({ error: "Shopping session not found" });
				return;
			}

			response.status(200).json({ deleted: true });
		} catch (error) {
			next(error);
		}
	};

	save = async (
		request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		const parseResult = saveShoppingSessionBodySchema.safeParse(request.body);

		if (!parseResult.success) {
			response.status(400).json({
				error: "Invalid request body",
				details: parseResult.error.flatten().fieldErrors,
			});
			return;
		}

		try {
			const userId: unknown = response.locals.userId;
			if (!this.isValidUserId(userId)) {
				response.status(401).json({ error: "Unauthorized" });
				return;
			}
			const { shoppedAt, items } = parseResult.data;

			const result = await this.saveShoppingSessionUseCase.execute({
				userId,
				shoppedAt,
				items,
			});

			response.status(201).json(result);
		} catch (error) {
			next(error);
		}
	};

	private isValidUserId(userId: unknown): userId is string {
		return typeof userId === "string" && userId.length > 0;
	}
}
