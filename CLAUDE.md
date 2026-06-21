# supermarket-planner

Monorepo for comparing supermarket prices in Las Palmas de Gran Canaria. Scrapes Mercadona, Carrefour, Aldi, Lidl and HiperDino in real time.

## Packages

- `backend/` — .NET REST API (ASP.NET Core), scraping with Playwright for .NET, EF Core + PostgreSQL, categorization with Gemini AI
- `frontend/` — Next.js 16 App Router, React 19 + React Compiler, Zustand, Tailwind CSS 4

> The backend is **.NET/C#**; the frontend stays **TypeScript**. Coding standards live in `.claude/skills/` and are split into Backend (.NET) and Frontend (TypeScript) sections.

## Code Navigation — use CodeGraph first

This repo is indexed with **CodeGraph** (`.codegraph/codegraph.db`; the `codegraph` CLI is on PATH). **Prefer it over blind `grep`/file-walking to navigate and understand the codebase** — it knows symbols, call relationships and impact across both the .NET backend and the TS frontend.

```bash
codegraph status                 # index health/stats
codegraph sync                   # refresh the index after edits (do this if results look stale)
codegraph query <text>           # find symbols (classes, methods, interfaces, routes…)
codegraph files                  # project file structure from the index
codegraph context "<task>"       # build task-focused context (markdown) before starting work
codegraph callers <symbol>       # who calls a symbol
codegraph callees <symbol>       # what a symbol calls
codegraph impact <symbol>        # what a change to a symbol affects (blast radius)
codegraph affected <files...>    # test files affected by changed sources
```

Typical flow: run `codegraph context "<what I'm about to do>"` and/or `codegraph query`/`callers`/`impact` to map the relevant code before editing; fall back to `grep`/Read for exact text or when CodeGraph has no entry. Run `codegraph sync` after significant edits so later queries stay accurate. A CodeGraph MCP server is also available (`codegraph serve` / `codegraph install`) if you prefer tool calls over the CLI.

## Architecture

### Backend — Strict Hexagonal Architecture (.NET)

```
Domain/            # Entities, value objects, domain services — ZERO framework dependencies
Application/       # Use cases + ports (driving/driven interfaces) — framework-free
  Ports/Driving/   # Primary ports: IComparePricesUseCase, ...
  Ports/Driven/    # Secondary ports: IProductRepository, ISupermarketScraper, ILogger, ...
Infrastructure/    # Everything technical: adapters, composition, config, logging
  Adapters/Driven/   # Secondary adapters: EF Core persistence, Playwright scrapers, Gemini AI, queues
  Adapters/Driving/  # Primary adapters: ASP.NET Core controllers/minimal APIs, cron (hosted services)
  Composition/       # Composition root (ServiceCollection extensions wired in Program.cs)
  Config/            # Configuration binding (appsettings, bound in composition root)
  Logging/           # Concrete logger (Microsoft.Extensions.Logging)
Program.cs         # Thin entrypoint: delegates to the composition root
```

**Composition root**: `Program.cs` + per-layer `IServiceCollection` extension methods.

Absolute rules:
- Never reference EF Core / ASP.NET Core / Playwright / `Microsoft.Extensions.Logging` from `Domain/` or `Application/`
- `Domain/` does not depend on `Application/` or `Infrastructure/`; `Application/` does not depend on `Infrastructure/`
- External dependencies (DB, logger, queues, scrapers, AI) are consumed via ports in `Application/Ports/Driven/` and injected from the composition root
- Each supermarket scraper is a driven adapter implementing a scraper port (strategy pattern); never instantiate the Playwright browser from the domain
- EF Core only in `Infrastructure/Adapters/Driven/Persistence/`
- Gemini AI only in `Infrastructure/Adapters/Driven/Ai/`
- HTTP endpoints and cron are driving adapters: they live in `Infrastructure/Adapters/Driving/`
- ALL domain/use-case operations return `Either<DomainError, T>` (SharpMonads.Core; Left = error, Right = value) — no `throw` for business errors (see `.claude/skills/rop/`)

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
dotnet run                                  # Run the API (port 3000)
dotnet build                                # Build (must pass: 0 errors, 0 warnings)
dotnet test                                 # All tests
dotnet test --filter "Category=Unit"        # Unit tests
dotnet test --filter "Category=Integration" # Integration tests (requires DB)
dotnet test --filter "Category=E2E"         # Scraping E2E tests with Playwright
dotnet ef migrations add <Name>             # Add a new EF Core migration
dotnet ef database update                   # Apply migrations
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

## Language Standards

### Backend (.NET / C#)
- Nullable reference types enabled; warnings-as-errors — `dotnet build` must be clean (0 warnings)
- ALL domain/use-case methods return `Either<DomainError, T>` (SharpMonads.Core); no `throw` for business errors (`.claude/skills/rop/`)
- Value objects are `readonly record struct`; entities are `record`; use cases are `sealed class` with `Invoke`
- No AutoMapper, no comments, no inheritance, no `ConfigureAwait`, no `out`, no `default!` (`.claude/skills/anti-patterns/`)

### Frontend (TypeScript)
- `strict: true`; never use `any`; never omit return types on public functions

## Testing Conventions

### Backend (.NET)
- tUnit + AwesomeAssertions + NSubstitute
- One test file per class: `ProductPriceShould.cs`, names `[Class]Should.VerbNounWhenCondition()`
- Arrange-Act-Extract-Assert; extract `.Value` once; all assertions at the end
- Mock at the driven-port boundary (`IProductRepository`, scrapers); never mock domain entities/value objects
- Categorize tests as `Unit` / `Integration` / `E2E` via `[Trait("Category", ...)]`

### Frontend (TypeScript)
- Co-located unit tests: `src/.../Foo.unit.test.ts` / `Foo.unit.test.tsx`
- Integration tests: `src/.../Foo.integration.test.ts`
- Naming: `describe("ClassName") { it("should [behavior]") }`
- Mock at the port boundary; never mock domain logic; RTL queries by semantic role

## Skills

Backend → .NET/C#, frontend → TypeScript. The architecture/naming/testing skills cover **both** layers
(with separate Backend (.NET) and Frontend (TypeScript) sections); the ROP and anti-pattern skills are
.NET backend only.

- `.claude/skills/clean-code/` — Standards index + commit checklists (start here)
- `.claude/skills/hexagonal-architecture/` — Layer isolation, ports/adapters, dependency rule (backend + frontend)
- `.claude/skills/class-first-architecture/` — DDD building blocks (.NET) + interface-driven design (backend + frontend)
- `.claude/skills/code-semantic/` — Semantic naming, Tell-Don't-Ask, expressive code (backend + frontend)
- `.claude/skills/rop/` — Railway-Oriented Programming, `Either<DomainError, T>` (SharpMonads.Core; backend .NET only)
- `.claude/skills/testing/` — tUnit/AAEA + Vitest/RTL testing patterns (backend + frontend)
- `.claude/skills/anti-patterns/` — Banned patterns: no AutoMapper, no comments, no inheritance (backend .NET only)

## Environment

- `.env` (root) — Docker Compose variables (Postgres, ports)
- Backend config: `appsettings.json` + `appsettings.Development.json`; secrets via user-secrets (`dotnet user-secrets`) or environment variables (`ConnectionStrings__Database`, `Gemini__ApiKey`, etc.)
- Never commit real secrets; keep `appsettings.json` free of secrets and use `appsettings.Example.json` / user-secrets as templates
- `Gemini:ApiKey` is required for the AI categorizer; leaving it empty disables it
