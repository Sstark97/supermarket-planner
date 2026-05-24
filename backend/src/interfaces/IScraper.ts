import { IProduct } from './IProduct';

export interface IScraper {
    readonly name: string;
    search(query: string): Promise<IProduct[]>;
}
