import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { SearchProductsUseCasePort } from "@application/ports/incoming/SearchProductsUseCasePort";

const searchQuerySchema = z.object({
	q: z.string().max(100).optional(),
	category: z.string().optional(),
	supermarket: z.string().optional(),
	sortBy: z.enum(["price_asc", "price_desc"]).optional(),
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
			const { q, category, supermarket, sortBy } = parseResult.data;
			const result = await this.searchProductsUseCase.execute({
				query: q,
				category,
				supermarket,
				sortBy,
			});

			response.json(result);
		} catch (error) {
			next(error);
		}
	};
}
