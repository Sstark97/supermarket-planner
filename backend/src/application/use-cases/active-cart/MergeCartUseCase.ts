import { v4 as uuidv4 } from "uuid";
import type { MergeCartUseCasePort } from "@application/ports/incoming/MergeCartUseCasePort";
import type { ActiveCartRepository } from "@application/ports/outgoing/ActiveCartRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { MergeCartInput, MergeCartItemInput, MergeCartResult, MergeCartResultItem } from "./contracts";
import { ActiveCartMerger } from "@domain/services/ActiveCartMerger";
import type { ActiveCart, ActiveCartItem } from "@domain/entities/ActiveCart";

export class MergeCartUseCase implements MergeCartUseCasePort {
	constructor(
		private readonly activeCartRepository: ActiveCartRepository,
		private readonly logger: LoggerPort,
	) {}

	async execute(input: MergeCartInput): Promise<MergeCartResult> {
		this.logger.info(
			`[MergeCartUseCase] execute - userId: "${input.userId}", incomingItems: ${input.items.length}`,
		);

		const existingCart = await this.activeCartRepository.findByUserId(input.userId);
		const existingItems: readonly ActiveCartItem[] = existingCart?.items ?? [];
		const incomingItems = input.items.map(MergeCartUseCase.toActiveCartItem);
		const mergedItems = ActiveCartMerger.merge(existingItems, incomingItems);

		const cartToUpsert: ActiveCart = {
			id: existingCart?.id ?? uuidv4(),
			userId: input.userId,
			updatedAt: new Date(),
			items: mergedItems,
		};

		const savedCart = await this.activeCartRepository.upsert(cartToUpsert);

		this.logger.info(
			`[MergeCartUseCase] cart upserted - id: "${savedCart.id}", totalItems: ${savedCart.items.length}`,
		);

		return MergeCartUseCase.toResult(savedCart);
	}

	private static toActiveCartItem(item: MergeCartItemInput): ActiveCartItem {
		return {
			productId: item.productId,
			productName: item.productName,
			supermarket: item.supermarket,
			category: item.category,
			price: item.price,
			pricePerUnit: item.pricePerUnit,
			unit: item.unit,
			taxType: item.taxType,
			quantity: item.quantity,
			image: item.image,
			url: item.url,
		};
	}

	private static toResult(cart: ActiveCart): MergeCartResult {
		return {
			cartId: cart.id,
			userId: cart.userId,
			totalItems: cart.items.length,
			items: cart.items.map((item: ActiveCartItem) =>
				MergeCartUseCase.mapCartItemToResultItem(item),
			),
		};
	}

	private static mapCartItemToResultItem(item: ActiveCartItem): MergeCartResultItem {
		return {
			productId: item.productId,
			productName: item.productName,
			supermarket: item.supermarket,
			category: item.category,
			price: item.price,
			pricePerUnit: item.pricePerUnit,
			unit: item.unit,
			taxType: item.taxType,
			quantity: item.quantity,
			image: item.image,
			url: item.url,
		};
	}
}
