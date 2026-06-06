export class ProductNameNormalizer {
	static normalize(name: string): string {
		return name
			.toLowerCase()
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.trim();
	}
}
