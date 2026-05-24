import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProductCategory } from '../interfaces/IProduct';
import { config } from '../config';
import { logger } from './logger';

// Keyword-based map for fast, free categorization (~90% coverage)
const KEYWORD_MAP: Record<string, ProductCategory> = {
    // Lácteos
    leche: ProductCategory.DAIRY, yogur: ProductCategory.DAIRY, queso: ProductCategory.DAIRY,
    mantequilla: ProductCategory.DAIRY, nata: ProductCategory.DAIRY, kéfir: ProductCategory.DAIRY,
    batido: ProductCategory.DAIRY, cuajada: ProductCategory.DAIRY,
    // Carnes
    pollo: ProductCategory.MEAT, cerdo: ProductCategory.MEAT, ternera: ProductCategory.MEAT,
    pechuga: ProductCategory.MEAT, lomo: ProductCategory.MEAT, jamón: ProductCategory.MEAT,
    salchich: ProductCategory.MEAT, chorizo: ProductCategory.MEAT, morcilla: ProductCategory.MEAT,
    hamburguesa: ProductCategory.MEAT, filete: ProductCategory.MEAT,
    // Pescados
    atún: ProductCategory.FISH, sardina: ProductCategory.FISH, salmón: ProductCategory.FISH,
    merluza: ProductCategory.FISH, bacalao: ProductCategory.FISH, gamba: ProductCategory.FISH,
    mejillón: ProductCategory.FISH, pulpo: ProductCategory.FISH, calamar: ProductCategory.FISH,
    // Frutas y Verduras
    plátano: ProductCategory.FRUITS_VEG, manzana: ProductCategory.FRUITS_VEG,
    naranja: ProductCategory.FRUITS_VEG, tomate: ProductCategory.FRUITS_VEG,
    lechuga: ProductCategory.FRUITS_VEG, zanahoria: ProductCategory.FRUITS_VEG,
    cebolla: ProductCategory.FRUITS_VEG, pimiento: ProductCategory.FRUITS_VEG,
    patata: ProductCategory.FRUITS_VEG, fruta: ProductCategory.FRUITS_VEG,
    verdura: ProductCategory.FRUITS_VEG, aguacate: ProductCategory.FRUITS_VEG,
    // Panadería
    pan: ProductCategory.BAKERY, baguette: ProductCategory.BAKERY, molde: ProductCategory.BAKERY,
    tostada: ProductCategory.BAKERY, bollería: ProductCategory.BAKERY,
    croissant: ProductCategory.BAKERY, bagel: ProductCategory.BAKERY,
    // Bebidas
    agua: ProductCategory.DRINKS, zumo: ProductCategory.DRINKS, refresco: ProductCategory.DRINKS,
    cerveza: ProductCategory.DRINKS, vino: ProductCategory.DRINKS, café: ProductCategory.DRINKS,
    té: ProductCategory.DRINKS, cola: ProductCategory.DRINKS, fanta: ProductCategory.DRINKS,
    // Congelados
    helado: ProductCategory.FROZEN, congelado: ProductCategory.FROZEN,
    pizza: ProductCategory.FROZEN, croqueta: ProductCategory.FROZEN,
    // Limpieza
    detergente: ProductCategory.CLEANING, lejía: ProductCategory.CLEANING,
    suavizante: ProductCategory.CLEANING, limpiador: ProductCategory.CLEANING,
    friegasuelos: ProductCategory.CLEANING, bayeta: ProductCategory.CLEANING,
    fregaplatos: ProductCategory.CLEANING, limpiacristales: ProductCategory.CLEANING,
    // Higiene Personal
    champú: ProductCategory.PERSONAL_CARE, gel: ProductCategory.PERSONAL_CARE,
    desodorante: ProductCategory.PERSONAL_CARE, pasta: ProductCategory.PERSONAL_CARE,
    maquinilla: ProductCategory.PERSONAL_CARE, higien: ProductCategory.PERSONAL_CARE,
    papel: ProductCategory.PERSONAL_CARE, colonia: ProductCategory.PERSONAL_CARE,
    // Snacks y Dulces
    patatas: ProductCategory.SNACKS, chips: ProductCategory.SNACKS,
    chocolate: ProductCategory.SNACKS, galleta: ProductCategory.SNACKS,
    caramelo: ProductCategory.SNACKS, gominola: ProductCategory.SNACKS,
    // Conservas
    lata: ProductCategory.CANNED_GOODS, conserva: ProductCategory.CANNED_GOODS,
    // Condimentos
    aceite: ProductCategory.CONDIMENTS, vinagre: ProductCategory.CONDIMENTS,
    sal: ProductCategory.CONDIMENTS, azúcar: ProductCategory.CONDIMENTS,
    mayonesa: ProductCategory.CONDIMENTS, ketchup: ProductCategory.CONDIMENTS,
    mostaza: ProductCategory.CONDIMENTS, especias: ProductCategory.CONDIMENTS,
    // Cereales y Pasta
    arroz: ProductCategory.CEREALS_PASTA,
    macarron: ProductCategory.CEREALS_PASTA, espagueti: ProductCategory.CEREALS_PASTA,
    cereal: ProductCategory.CEREALS_PASTA, avena: ProductCategory.CEREALS_PASTA,
    harina: ProductCategory.CEREALS_PASTA,
    // Bebé
    pañal: ProductCategory.BABY, potito: ProductCategory.BABY, biberón: ProductCategory.BABY,
    // Mascotas
    pienso: ProductCategory.PET, gato: ProductCategory.PET, perro: ProductCategory.PET,
};

// Request-scoped cache to avoid redundant Gemini calls
const geminiCache = new Map<string, ProductCategory>();

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
    return genAI;
}

/**
 * Attempts to categorize a product name using the keyword map.
 * Returns undefined if no keyword matches.
 */
function classifyWithKeywords(productName: string): ProductCategory | undefined {
    const lower = productName.toLowerCase();
    for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
        if (lower.includes(keyword)) {
            return category;
        }
    }
    return undefined;
}

/**
 * Calls Gemini to classify a product name that the keyword map couldn't handle.
 */
async function classifyWithGemini(productName: string): Promise<ProductCategory> {
    if (!config.geminiApiKey) {
        logger.warn('[ProductCategorizer] GEMINI_API_KEY not set, falling back to OTHER');
        return ProductCategory.OTHER;
    }

    const cacheKey = productName.toLowerCase().trim();
    if (geminiCache.has(cacheKey)) {
        return geminiCache.get(cacheKey)!;
    }

    try {
        const model = getGenAI().getGenerativeModel({ model: config.geminiModel });
        const categories = Object.values(ProductCategory).join(', ');
        const prompt = `You are a supermarket product categorizer. Given the following product name in Spanish, classify it into exactly one of these categories: ${categories}. Reply with ONLY the category value, nothing else.\n\nProduct: "${productName}"`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim().toLowerCase();

        const matched = Object.values(ProductCategory).find(c => c === raw) ?? ProductCategory.OTHER;
        geminiCache.set(cacheKey, matched);
        return matched;
    } catch (error) {
        logger.error(`[ProductCategorizer] Gemini call failed: ${String(error)}`);
        return ProductCategory.OTHER;
    }
}

/**
 * Main categorization function.
 * Uses keyword map first (fast). Falls back to Gemini if not matched.
 */
export async function categorize(productName: string): Promise<ProductCategory> {
    const fromKeywords = classifyWithKeywords(productName);
    if (fromKeywords) return fromKeywords;
    return classifyWithGemini(productName);
}
