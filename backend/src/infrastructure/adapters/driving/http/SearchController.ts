import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { SearchProductsUseCasePort } from "@application/ports/incoming/SearchProductsUseCasePort";

const searchQuerySchema = z.object({
	q: z.string().max(100).optional(),
	category: z.string().optional(),
	supermarket: z.string().optional(),
	sortBy: z.enum(["price_asc", "price_desc"]).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	cursor: z.string().regex(/^\d+$/, "cursor must be a non-negative integer string").optional(),
});

export class SearchController {
	constructor(private readonly searchProductsUseCase: SearchProductsUseCasePort) {}

	search = async (
		request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		const parseResult = searchQuerySchema.safeParse(request.query);

		if (!parseResult.success) {
			response.status(400).json({
				error: "Invalid query",
				details: parseResult.error.flatten().fieldErrors,
			});
			return;
		}

		try {
			const { q, category, supermarket, sortBy, limit, cursor } = parseResult.data;
			const result = await this.searchProductsUseCase.execute({
				query: q,
				category,
				supermarket,
				sortBy,
				limit,
				cursor,
			});

			response.json(result);
		} catch (error) {
			next(error);
		}
	};
}
