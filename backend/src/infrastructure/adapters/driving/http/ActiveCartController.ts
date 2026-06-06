import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import type { MergeCartUseCasePort } from "@application/ports/incoming/MergeCartUseCasePort";

const activeCartItemSchema = z.object({
	productId: z.string().min(1),
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

const mergeCartBodySchema = z.object({
	items: z
		.array(activeCartItemSchema)
		.max(500, { message: "Cart cannot contain more than 500 items." }),
});

export class ActiveCartController {
	constructor(private readonly mergeCartUseCase: MergeCartUseCasePort) {}

	merge = async (
		request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		const parseResult = mergeCartBodySchema.safeParse(request.body);

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

			const { items } = parseResult.data;

			const result = await this.mergeCartUseCase.execute({
				userId,
				items,
			});

			response.status(200).json(result);
		} catch (error) {
			next(error);
		}
	};

	private isValidUserId(userId: unknown): userId is string {
		return typeof userId === "string" && userId.length > 0;
	}
}
