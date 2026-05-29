export enum ProductCategory {
    DAIRY = 'dairy',
    MEAT = 'meat',
    FISH = 'fish',
    FRUITS_VEG = 'fruits_veg',
    BAKERY = 'bakery',
    DRINKS = 'drinks',
    FROZEN = 'frozen',
    CLEANING = 'cleaning',
    PERSONAL_CARE = 'personal_care',
    SNACKS = 'snacks',
    CANNED_GOODS = 'canned_goods',
    CONDIMENTS = 'condiments',
    CEREALS_PASTA = 'cereals_pasta',
    BABY = 'baby',
    PET = 'pet',
    OTHER = 'other',
}

export interface IProduct {
    id: string;
    name: string;
    supermarket: string;
    category: ProductCategory;
    price: number;
    pricePerUnit: number;
    unit: string;
    image?: string;
    url?: string;
    taxType: 'IGIC' | 'IVA' | 'UNKNOWN';
    scrapedAt: string;
}
