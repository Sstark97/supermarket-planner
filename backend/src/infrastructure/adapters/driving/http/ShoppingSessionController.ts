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
		_req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId: unknown = res.locals.userId;
			if (typeof userId !== "string" || userId.length === 0) {
				res.status(401).json({ error: "Unauthorized" });
				return;
			}

			const result = await this.getShoppingSessionMetricsUseCase.execute({
				userId,
			});
			res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	};

	get = async (
		_req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId: unknown = res.locals.userId;
			if (typeof userId !== "string" || userId.length === 0) {
				res.status(401).json({ error: "Unauthorized" });
				return;
			}

			const result = await this.getShoppingSessionsUseCase.execute({ userId });
			res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	};

	delete = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		const paramsResult = shoppingSessionIdParamsSchema.safeParse(req.params);
		if (!paramsResult.success) {
			res.status(400).json({ error: "Invalid shopping session id" });
			return;
		}

		try {
			const userId: unknown = res.locals.userId;
			if (typeof userId !== "string" || userId.length === 0) {
				res.status(401).json({ error: "Unauthorized" });
				return;
			}

			const result = await this.deleteShoppingSessionUseCase.execute({
				sessionId: paramsResult.data.id,
				userId,
			});

			if (!result.deleted) {
				res.status(404).json({ error: "Shopping session not found" });
				return;
			}

			res.status(200).json({ deleted: true });
		} catch (error) {
			next(error);
		}
	};

	save = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		const parseResult = saveShoppingSessionBodySchema.safeParse(req.body);

		if (!parseResult.success) {
			res.status(400).json({
				error: "Invalid request body",
				details: parseResult.error.flatten().fieldErrors,
			});
			return;
		}

		try {
			const userId: unknown = res.locals.userId;
			if (typeof userId !== "string" || userId.length === 0) {
				res.status(401).json({ error: "Unauthorized" });
				return;
			}
			const { shoppedAt, items } = parseResult.data;

			const result = await this.saveShoppingSessionUseCase.execute({
				userId,
				shoppedAt,
				items,
			});

			res.status(201).json(result);
		} catch (error) {
			next(error);
		}
	};
}
