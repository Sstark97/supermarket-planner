# supermarket-planner

Monorepo for comparing supermarket prices in Las Palmas de Gran Canaria. Scrapes Mercadona, Carrefour, Aldi, Lidl and HiperDino in real time.

## Packages

- `backend/` — REST API with Express, scraping with Playwright, Prisma + PostgreSQL, categorization with Gemini AI
- `frontend/` — Next.js 16 App Router, React 19 + React Compiler, Zustand, Tailwind CSS 4

## Architecture

### Backend — Strict Hexagonal Architecture

```
src/
├── domain/           # Entities, value objects, domain services — ZERO framework dependencies
├── application/      # Use cases + ports (incoming/outgoing interfaces) — framework-free
├── infrastructure/   # Everything technical: adapters, composition, config, logging
│   ├── adapters/
│   │   ├── driven/       # Secondary adapters: Prisma, Playwright scrapers, Gemini AI, queues, categorization
│   │   └── driving/      # Primary adapters: HTTP controllers (Express), cron (node-cron)
│   ├── composition/      # Composition root (bootstrap.ts)
│   ├── config/           # Configuration/environment loading (dotenv)
│   └── logging/          # Concrete logger (winston)
└── index.ts          # Thin entrypoint: delegates to the composition root
```

**Composition root**: `src/infrastructure/composition/bootstrap.ts`

Absolute rules:
- Never import Prisma/Express/Playwright/node-cron/winston/dotenv in `domain/` or `application/`
- `domain/` does not import from `application/` or `infrastructure/`; `application/` does not import from `infrastructure/`
- External dependencies (DB, logger, queues, scrapers) are consumed via ports in `application/ports/outgoing/` and injected from the composition root (e.g. `LoggerPort`)
- Scrapers extend `PlaywrightScraperAdapterBase`, never instantiate the browser directly
- Prisma only in `infrastructure/adapters/driven/persistence/`
- Gemini AI only in `infrastructure/adapters/driven/ai/`
- HTTP controllers and cron are driving adapters: they live in `infrastructure/adapters/driving/`

### Frontend — Feature-based modules

```
src/
├── app/              # App Router: pages, layouts, API routes
├── components/       # Shared UI components
├── features/         # Feature modules (product-search, cart, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Infrastructure: HTTP clients, DI container
├── store/            # Client state with Zustand
└── types/            # Shared TypeScript types
```

**DI container**: `src/lib/di/ContainerDI.ts`

React Compiler is enabled — avoid manual `useMemo`/`useCallback` unless explicitly justified.

## Build Commands

### Backend (run from `backend/`)

```bash
npm run dev                     # tsx watch (port 3000)
npm run build                   # Compile TypeScript → dist/
npm run test                    # All Vitest tests
npm run test:unit               # Unit tests
npm run test:integration        # Integration tests (requires DB)
npm run test:e2e                # Scraping E2E tests with Playwright
npx prisma migrate dev          # Apply a new migration
npx prisma generate             # Regenerate client after a schema change
```

### Frontend (run from `frontend/`)

```bash
npm run dev     # Next.js dev (port 3001 via Docker, 3000 direct)
npm run build   # Production build
npm run test    # Vitest + React Testing Library tests
npm run lint    # ESLint
```

### Docker (run from root)

```bash
docker compose up -d              # All services
docker compose up database -d     # PostgreSQL only (for local backend dev)
```

## TypeScript

- Both packages: `strict: true`
- Backend adds: `noImplicitAny`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- Never use `any`; never omit return types on public functions

## Testing Conventions

- Co-located unit tests: `src/.../Foo.unit.test.ts` / `Foo.unit.test.tsx`
- Integration tests: `src/.../Foo.integration.test.ts`
- Scraping E2E tests: `backend/tests/e2e/`
- Naming: `describe("ClassName") { it("should [behavior]") }`
- Mock at the port/repository boundary; never mock domain logic

## Skills

- `.claude/skills/hexagonal-architecture/` — Layer isolation rules
- `.claude/skills/class-first-architecture/` — Interface-driven design
- `.claude/skills/code-semantic/` — Expressive, clean code
- `.claude/skills/testing/` — Testing patterns for this project

## Environment

- `.env` (root) — Docker Compose variables (Postgres, ports)
- `backend/.env` — Local dev variables (DATABASE_URL, GEMINI_API_KEY, etc.)
- Never commit `.env` with real secrets; use `.env.example` as a template
- `GEMINI_API_KEY` is required for the AI categorizer; leaving it empty disables it
