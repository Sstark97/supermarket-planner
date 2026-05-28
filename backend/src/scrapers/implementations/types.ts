import type {
	MercadonaApiProduct,
	MercadonaPriceInstructions,
	MercadonaSearchResponse,
} from "../../application/dto/ScraperPayloads";

export interface MercadonaSearchRequest {
	query: string;
	offset: number;
	limit: number;
	wh: string;
}

export type {
	MercadonaApiProduct,
	MercadonaPriceInstructions,
	MercadonaSearchResponse,
};
