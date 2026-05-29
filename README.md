# Supermarket Planner (Antigravity)

Project for comparing supermarket prices (Mercadona, Carrefour, Lidl, Aldi, HiperDino) in Las Palmas / Canary Islands.

## Overview
Node.js + TypeScript backend that scrapes with Playwright and direct API calls. Results are stored in PostgreSQL via Prisma. The frontend (Next.js) reads data from the database and shows comparisons.

> Important note: The public `GET /search` endpoint only queries the database. To get live data you must run the cron or trigger the manual scraping endpoints.

## Technologies
- Node.js, TypeScript
- Playwright (browser-based scrapers)
- Express, Zod
- Prisma + PostgreSQL
- Next.js (frontend)
- Winston for logs (to console)

## Quickstart (local)
1. Start PostgreSQL:

```bash
# From the root
docker-compose up -d
```

2. Backend

```bash
cd backend
# Install dependencies (npm/pnpm/yarn as you prefer)
npm install
# Create .env from .env.example and adjust DATABASE_URL, POSTAL_CODE, PLAYWRIGHT_HEADLESS, etc.
cp .env.example .env
# Push schema to the DB
npx prisma db push
# Start in development mode
npm run dev
```

3. Frontend

```bash
cd frontend
npm install
# Adjust NEXT_PUBLIC_API_URL if the backend is not at http://localhost:3000
npm run dev
```

## Scraping
- Manual: POST /admin/scrape/:query
- Full loop: POST /admin/scrape-all (runs the full execution in the background)
- Cron: scheduled in `backend/src/infrastructure/adapters/driving/cron/scraperCron.ts` to run daily at 04:00

For the frontend to show results: run at least one `POST /admin/scrape/:query` or the `scrape-all`, then query `GET /search?q=<term>`.

## Debugging and immediate recommendations
- Check `SCRAPING_DIAGNOSTIC_REPORT.md` (generated) to find fragile spots.
- Logging goes to the console; if you need persistence, add a winston File transport.
- If scrapers return `[]`: verify that the cron or manual endpoint ran and that the DB contains records.
- For protected sites (Carrefour, Mercadona) consider:
  - Proxy rotation / residential proxies
  - Capturing screenshots and HTML dumps on failure
  - Advanced stealth techniques and retries

## Repo organization
- `backend/src/infrastructure/adapters/driven/scraping/supermarkets/*` — scrapers per supermarket
- `backend/src/infrastructure/adapters/driven/scraping/strategies` — BrowserManager, StealthHelper
- `backend/src/infrastructure/adapters/driving/cron` — cron logic and predefined queries
- `frontend/src` — Next.js UI

## Contact
To hand this repo to a scraping expert: share this README + `SCRAPING_DIAGNOSTIC_REPORT.md` and access to the environment (DATABASE_URL, .env variables).

---
README generated and committed in the local repo.
