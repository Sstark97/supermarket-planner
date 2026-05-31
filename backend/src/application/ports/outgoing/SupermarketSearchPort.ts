import type { IProduct } from "@domain/entities/IProduct";

export interface CircuitBreakerStatus {
	state: "open" | "closed";
	isOpen: boolean;
	failureCount: number;
	threshold: number;
}

export interface SupermarketSearchPort {
	readonly name: string;
	search(query: string): Promise<IProduct[]>;
	readonly isCircuitOpen: boolean;
	getCircuitBreakerStatus(): CircuitBreakerStatus;
}
