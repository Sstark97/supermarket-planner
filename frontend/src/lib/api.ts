import { IProduct } from '../types';

export async function fetchProducts(query?: string, category?: string, supermarket?: string, sortBy?: string): Promise<IProduct[]> {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (supermarket) params.set('supermarket', supermarket);
    if (sortBy) params.set('sortBy', sortBy);

    const url = `${backendUrl}/search?${params.toString()}`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 0 }, // Disable cache for debugging
        });

        if (!res.ok) {
            if (res.status === 400 && !query) {
                // Return popular items or empty list for initial load
                return [];
            }
            throw new Error(`API Error: ${res.status}`);
        }

        const json = await res.json();
        return json.results || [];
    } catch (err) {
        console.error('Fetch products error:', err);
        return [];
    }
}
