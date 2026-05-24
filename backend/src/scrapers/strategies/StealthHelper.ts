import { Page } from 'playwright';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

const BLOCKED_RESOURCE_TYPES = ['image', 'font', 'media'];
const BLOCKED_URL_PATTERNS = [
    'google-analytics',
    'googletagmanager',
    'hotjar',
    'facebook.net',
    'doubleclick',
    'analytics',
    'ads.',
];

export function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function randomDelay(minMs = 300, maxMs = 1200): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Intercepts and aborts unnecessary resources (images, fonts, trackers).
 * This dramatically speeds up page loads for HTML-heavy sites.
 */
export async function blockUnnecessaryResources(page: Page): Promise<void> {
    await page.route('**/*', (route) => {
        const request = route.request();
        const resourceType = request.resourceType();
        const url = request.url();

        const isBlockedType = BLOCKED_RESOURCE_TYPES.includes(resourceType);
        const isBlockedUrl = BLOCKED_URL_PATTERNS.some(pattern => url.includes(pattern));

        if (isBlockedType || isBlockedUrl) {
            route.abort();
        } else {
            route.continue();
        }
    });
}

/**
 * Simulates a human typing a string character by character with random delays.
 */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector);
    for (const char of text) {
        await page.keyboard.type(char);
        await randomDelay(50, 150);
    }
}
