import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT ?? '3000', 10),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    playwrightHeadless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD ?? '5', 10),
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
    postalCode: process.env.POSTAL_CODE ?? '35010',
};
