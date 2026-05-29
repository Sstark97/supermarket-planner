# supermarket-planner

Monorepo para comparar precios de supermercados en Las Palmas de Gran Canaria. Raspa Mercadona, Carrefour, Aldi, Lidl y HiperDino en tiempo real.

## Paquetes

- `backend/` — API REST con Express, scraping con Playwright, Prisma + PostgreSQL, categorización con Gemini AI
- `frontend/` — Next.js 16 App Router, React 19 + React Compiler, Zustand, Tailwind CSS 4

## Arquitectura

### Backend — Arquitectura Hexagonal estricta

```
src/
├── domain/           # Entidades, value objects, servicios de dominio — CERO dependencias de framework
├── application/      # Casos de uso + puertos (incoming/outgoing interfaces)
├── infrastructure/   # Adaptadores: Prisma, scrapers Playwright, Gemini AI, colas
└── controllers/      # Adaptadores HTTP driving (Express)
```

**Raíz de composición**: `src/infrastructure/composition/bootstrap.ts`

Reglas absolutas:
- Nunca importar Prisma/Express/Playwright/node-cron en `domain/` o `application/`
- Los scrapers extienden `PlaywrightScraperAdapterBase`, nunca instancian browser directamente
- Prisma solo en `infrastructure/adapters/driven/persistence/`
- Gemini AI solo en `infrastructure/adapters/driven/ai/`

### Frontend — Módulos por feature

```
src/
├── app/              # App Router: páginas, layouts, rutas API
├── components/       # Componentes UI compartidos
├── features/         # Módulos de feature (product-search, cart, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Infraestructura: HTTP clients, contenedor DI
├── store/            # Estado cliente con Zustand
└── types/            # Tipos TypeScript compartidos
```

**Contenedor DI**: `src/lib/di/ContainerDI.ts`

React Compiler está activo — evitar `useMemo`/`useCallback` manuales salvo justificación explícita.

## Comandos de Build

### Backend (ejecutar desde `backend/`)

```bash
npm run dev                     # tsx watch (puerto 3000)
npm run build                   # Compila TypeScript → dist/
npm run test                    # Todos los tests Vitest
npm run test:unit               # Tests unitarios
npm run test:integration        # Tests de integración (requiere DB)
npm run test:e2e                # Tests E2E de scraping con Playwright
npx prisma migrate dev          # Aplicar nueva migración
npx prisma generate             # Regenerar cliente tras cambio de schema
```

### Frontend (ejecutar desde `frontend/`)

```bash
npm run dev     # Next.js dev (puerto 3001 vía Docker, 3000 directo)
npm run build   # Build de producción
npm run test    # Tests Vitest + React Testing Library
npm run lint    # ESLint
```

### Docker (ejecutar desde raíz)

```bash
docker compose up -d              # Todos los servicios
docker compose up database -d     # Solo PostgreSQL (para dev local de backend)
```

## TypeScript

- Ambos paquetes: `strict: true`
- Backend añade: `noImplicitAny`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- Nunca usar `any`; nunca omitir tipos de retorno en funciones públicas

## Convenciones de Testing

- Tests unitarios collocados: `src/.../Foo.unit.test.ts` / `Foo.unit.test.tsx`
- Tests de integración: `src/.../Foo.integration.test.ts`
- Tests E2E de scraping: `backend/tests/e2e/`
- Nomenclatura: `describe("ClassName") { it("should [comportamiento]") }`
- Mockear en el límite del puerto/repositorio; nunca mockear la lógica de dominio

## Skills

- `.claude/skills/hexagonal-architecture/` — Reglas de aislamiento entre capas
- `.claude/skills/class-first-architecture/` — Diseño orientado a interfaces
- `.claude/skills/code-semantic/` — Código expresivo y limpio
- `.claude/skills/testing/` — Patrones de testing para este proyecto

## Entorno

- `.env` (raíz) — Variables de Docker Compose (Postgres, puertos)
- `backend/.env` — Variables de dev local (DATABASE_URL, GEMINI_API_KEY, etc.)
- Nunca commitear `.env` con secretos reales; usar `.env.example` como plantilla
- `GEMINI_API_KEY` es necesario para el categorizador AI; dejar vacío lo deshabilita
