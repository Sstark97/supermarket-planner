import { headers } from "next/headers";
import { ProductGateway } from "@/lib/http/ProductGateway";
import { ProductHttpClient } from "@/lib/http/ProductHttpClient";

type HeaderReader = {
	get(name: string): string | null;
};

export class ContainerDI {
	constructor(private readonly headerReader: HeaderReader) {}

	resolveProductGateway(): ProductGateway {
		const internalAppUrl = process.env.INTERNAL_APP_URL;
		if (internalAppUrl) {
			return new ProductHttpClient(internalAppUrl);
		}

		const host =
			this.headerReader.get("x-forwarded-host") ??
			this.headerReader.get("host");
		const protocol = this.headerReader.get("x-forwarded-proto") ?? "http";
		const baseUrl = host
			? `${protocol}://${host}`
			: process.env.APP_URL || "http://localhost:3001";

		return new ProductHttpClient(baseUrl);
	}
}

export async function createServerContainer(): Promise<ContainerDI> {
	const h = await headers();
	return new ContainerDI(h);
}
