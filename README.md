# Supermarket Planner (Antigravity)

Proyecto para comparar precios de supermercados (Mercadona, Carrefour, Lidl, Aldi, HiperDino) en Las Palmas / Canarias.

## Resumen
Backend Node.js + TypeScript que realiza scraping con Playwright y llamadas directas a APIs. Los resultados se guardan en PostgreSQL via Prisma. El frontend (Next.js) lee datos desde la base y muestra comparativas.

> Nota importante: El endpoint público `GET /search` solo consulta la base de datos. Para obtener datos en vivo hay que ejecutar el cron o disparar los endpoints de scraping manual.

## Tecnologías
- Node.js, TypeScript
- Playwright (scrapers browser-based)
- Express, Zod
- Prisma + PostgreSQL
- Next.js (frontend)
- Winston para logs (por consola)

## Quickstart (local)
1. Levantar PostgreSQL:

```bash
# Desde la raíz
docker-compose up -d
```

2. Backend

```bash
cd backend
# Instalar dependencias (npm/pnpm/yarn según prefieras)
npm install
# Crear .env a partir de .env.example y ajustar DATABASE_URL, POSTAL_CODE, PLAYWRIGHT_HEADLESS, etc.
cp .env.example .env
# Push schema a la DB
npx prisma db push
# Iniciar en modo desarrollo
npm run dev
```

3. Frontend

```bash
cd frontend
npm install
# Ajustar NEXT_PUBLIC_API_URL si el backend no está en http://localhost:3000
npm run dev
```

## Scraping
- Manual: POST /admin/scrape/:query
- Full loop: POST /admin/scrape-all (lanza la ejecución completa en background)
- Cron: programado en `backend/src/infrastructure/adapters/driving/cron/scraperCron.ts` para ejecutarse a las 04:00 diariamente

Para que el frontend muestre resultados: ejecutar al menos un `POST /admin/scrape/:query` o el `scrape-all` y luego consultar `GET /search?q=<term>`.

## Debugging y recomendaciones inmediatas
- Revisar `SCRAPING_DIAGNOSTIC_REPORT.md` (generado) para encontrar puntos frágiles.
- El logging va a consola; si necesitas persistencia, añadir winston File transport.
- Si scrapers devuelven `[]`: comprobar que el cron o endpoint manual se ejecutaron y que la DB contiene registros.
- Para sitios protegidos (Carrefour, Mercadona) considerar:
  - Rotación de proxies / proxies residenciales
  - Captura de screenshots y HTML dump al fallo
  - Uso de técnicas stealth avanzadas y retries

## Organización del repo
- `backend/src/infrastructure/adapters/driven/scraping/supermarkets/*` — scrapers por supermercado
- `backend/src/infrastructure/adapters/driven/scraping/strategies` — BrowserManager, StealthHelper
- `backend/src/infrastructure/adapters/driving/cron` — lógica del cron y queries predefinidas
- `frontend/src` — UI Next.js

## Contacto
Para pasar este repo a un experto en scraping: compartir este README + `SCRAPING_DIAGNOSTIC_REPORT.md` y acceso al entorno (DATABASE_URL, variables .env). 

---
README generado y commiteado en el repo local.
